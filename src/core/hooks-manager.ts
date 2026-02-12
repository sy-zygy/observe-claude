import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_PATH = join(CLAUDE_DIR, "settings.local.json");
const OBSERVE_DIR = join(homedir(), ".observe-claude");
const EVENTS_DIR = join(OBSERVE_DIR, "events");

// The hook script path — resolve relative to this package
// At runtime, import.meta.url is dist/chunk-xxx.js, so ../.. gets to package root
const HOOK_SCRIPT = join(
	resolve(fileURLToPath(import.meta.url), "../.."),
	"hooks",
	"observe-claude-hook.mjs",
);

const HOOK_EVENTS = ["PreToolUse", "PostToolUse", "Stop", "PreCompact", "SessionStart"] as const;
const HOOK_MARKER = "observe-claude";

interface InstallResult {
	installed: boolean;
	settingsPath: string;
	hookScript: string;
}

interface RemoveResult {
	removed: boolean;
	settingsPath: string;
}

async function readSettings(): Promise<Record<string, unknown>> {
	try {
		const content = await readFile(SETTINGS_PATH, "utf-8");
		return JSON.parse(content);
	} catch {
		return {};
	}
}

async function writeSettings(settings: Record<string, unknown>): Promise<void> {
	await mkdir(CLAUDE_DIR, { recursive: true });
	await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
}

/**
 * Install observe-claude hooks into .claude/settings.local.json.
 * Merges with existing hooks — does not clobber.
 */
export async function installHooks(): Promise<InstallResult> {
	// Ensure events directory exists
	await mkdir(EVENTS_DIR, { recursive: true });

	const settings = await readSettings();

	// Initialize hooks object if not present
	if (!settings.hooks || typeof settings.hooks !== "object") {
		settings.hooks = {};
	}

	const hooks = settings.hooks as Record<string, unknown>;
	let anyInstalled = false;

	for (const event of HOOK_EVENTS) {
		if (!hooks[event] || !Array.isArray(hooks[event])) {
			hooks[event] = [];
		}

		const eventHooks = hooks[event] as Array<{ command: string; matcher?: string }>;
		const alreadyInstalled = eventHooks.some(
			(h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER),
		);

		if (!alreadyInstalled) {
			eventHooks.push({
				command: `node "${HOOK_SCRIPT}"`,
			});
			anyInstalled = true;
		}
	}

	if (anyInstalled) {
		await writeSettings(settings);
	}

	return {
		installed: anyInstalled,
		settingsPath: SETTINGS_PATH,
		hookScript: HOOK_SCRIPT,
	};
}

/**
 * Remove observe-claude hooks from .claude/settings.local.json.
 */
export async function removeHooks(): Promise<RemoveResult> {
	const settings = await readSettings();

	if (!settings.hooks || typeof settings.hooks !== "object") {
		return { removed: false, settingsPath: SETTINGS_PATH };
	}

	const hooks = settings.hooks as Record<string, unknown>;
	let anyRemoved = false;

	for (const event of HOOK_EVENTS) {
		if (!Array.isArray(hooks[event])) continue;

		const eventHooks = hooks[event] as Array<{ command: string }>;
		const filtered = eventHooks.filter(
			(h) => !(typeof h.command === "string" && h.command.includes(HOOK_MARKER)),
		);

		if (filtered.length !== eventHooks.length) {
			anyRemoved = true;
			hooks[event] = filtered;
		}

		// Clean up empty arrays
		if (filtered.length === 0) {
			delete hooks[event];
		}
	}

	if (anyRemoved) {
		// Clean up empty hooks object
		if (Object.keys(hooks).length === 0) {
			settings.hooks = undefined;
		}

		await writeSettings(settings);
	}

	return { removed: anyRemoved, settingsPath: SETTINGS_PATH };
}
