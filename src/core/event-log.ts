import { readFile, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HookEvent } from "./types.js";

const EVENTS_DIR = join(homedir(), ".observe-claude", "events");

/**
 * Read hook events for a specific session from the event log.
 */
export async function readSessionEvents(sessionId: string): Promise<HookEvent[]> {
	const filePath = join(EVENTS_DIR, `${sessionId}.jsonl`);
	const events: HookEvent[] = [];

	try {
		const content = await readFile(filePath, "utf-8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				const event = JSON.parse(trimmed) as HookEvent;
				events.push(event);
			} catch {
				// skip malformed lines
			}
		}
	} catch {
		// file doesn't exist or unreadable
	}

	return events;
}

/**
 * List all session IDs that have event logs.
 */
export async function listEventSessions(): Promise<string[]> {
	try {
		const entries = await readdir(EVENTS_DIR);
		return entries.filter((e) => e.endsWith(".jsonl")).map((e) => e.replace(".jsonl", ""));
	} catch {
		return [];
	}
}
