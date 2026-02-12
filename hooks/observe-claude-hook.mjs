#!/usr/bin/env node

/**
 * observe-claude hook script.
 * Reads JSON from stdin, appends structured event to ~/.observe-claude/events/<session-id>.jsonl.
 * Always exits 0 — never blocks Claude Code.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const EVENTS_DIR = join(homedir(), ".observe-claude", "events");

async function main() {
	try {
		// Read JSON from stdin
		const chunks = [];
		for await (const chunk of process.stdin) {
			chunks.push(chunk);
		}
		const input = Buffer.concat(chunks).toString("utf-8").trim();
		if (!input) {
			process.exit(0);
		}

		const data = JSON.parse(input);

		// Extract fields
		const event = {
			timestamp: new Date().toISOString(),
			hookEventName: data.hook_event_name ?? data.event ?? "unknown",
			sessionId: data.session_id ?? "unknown",
			toolName: data.tool_name ?? data.tool?.name ?? undefined,
			toolInput: data.tool_input ?? data.tool?.input ?? undefined,
		};

		// Ensure events directory exists
		await mkdir(EVENTS_DIR, { recursive: true });

		// Append to session-specific event log
		const logPath = join(EVENTS_DIR, `${event.sessionId}.jsonl`);
		await appendFile(logPath, `${JSON.stringify(event)}\n`, "utf-8");
	} catch {
		// Silently fail — never block Claude Code
	}

	process.exit(0);
}

main();
