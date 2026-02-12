import { installHooks } from "../core/hooks-manager.js";

export async function init(): Promise<void> {
	try {
		const result = await installHooks();
		if (result.installed) {
			console.log("✓ observe-claude hooks installed globally.");
			console.log("");
			console.log(`  Settings:  ${result.settingsPath}`);
			console.log(`  Script:    ${result.hookScript}`);
			console.log("  Events:    ~/.observe-claude/events/");
			console.log("");
			console.log("  Hooks: PreToolUse, PostToolUse, Stop, PreCompact, SessionStart");
			console.log("  These hooks apply to ALL Claude Code sessions across all projects.");
			console.log("  Run `observe-claude teardown` to remove them.");
		} else {
			console.log("observe-claude hooks are already installed globally.");
			console.log(`  Settings: ${result.settingsPath}`);
		}
	} catch (err) {
		console.error("Failed to install hooks:", err instanceof Error ? err.message : err);
		process.exit(1);
	}
}
