import { readFile, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseLine } from "./jsonl-parser.js";
import type { SessionInfo, SessionsIndex } from "./types.js";

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

/** Encode a project path: /Users/foo/bar -> -Users-foo-bar */
export function encodeProjectPath(cwd: string): string {
	const absolute = resolve(cwd);
	return absolute.replace(/\//g, "-");
}

/** Decode an encoded project path: -Users-foo-bar -> /Users/foo/bar */
export function decodeProjectPath(encoded: string): string {
	// Replace leading dash and all dashes with /
	return encoded.replace(/-/g, "/");
}

/** Check if a directory exists */
async function dirExists(path: string): Promise<boolean> {
	try {
		const s = await stat(path);
		return s.isDirectory();
	} catch {
		return false;
	}
}

/** Check if a file exists */
async function fileExists(path: string): Promise<boolean> {
	try {
		const s = await stat(path);
		return s.isFile();
	} catch {
		return false;
	}
}

/**
 * Read sessions-index.json from a project directory.
 * Returns null if the file doesn't exist or is malformed.
 */
async function readSessionsIndex(projectDir: string): Promise<SessionsIndex | null> {
	const indexPath = join(projectDir, "sessions-index.json");
	try {
		const content = await readFile(indexPath, "utf-8");
		const parsed = JSON.parse(content);
		if (parsed && Array.isArray(parsed.sessions)) {
			return parsed as SessionsIndex;
		}
		// Some indices are just arrays
		if (Array.isArray(parsed)) {
			return { sessions: parsed };
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Scan a project directory for .jsonl session files.
 * Fallback when sessions-index.json is missing.
 */
async function scanJsonlFiles(projectDir: string): Promise<SessionInfo[]> {
	const encodedPath = projectDir.split("/").pop() ?? "";

	try {
		const entries = await readdir(projectDir);
		const jsonlFiles = entries.filter((e) => e.endsWith(".jsonl"));
		const sessions: SessionInfo[] = [];

		for (const file of jsonlFiles) {
			const sessionId = file.replace(".jsonl", "");
			const filePath = join(projectDir, file);
			try {
				const s = await stat(filePath);
				sessions.push({
					sessionId,
					projectPath: decodeProjectPath(encodedPath),
					encodedPath,
					jsonlPath: filePath,
					modified: s.mtime,
					created: s.birthtime,
				});
			} catch {
				// skip unreadable files
			}
		}

		return sessions;
	} catch {
		return [];
	}
}

/**
 * List all sessions across all project directories.
 */
export async function listAllSessions(): Promise<SessionInfo[]> {
	if (!(await dirExists(PROJECTS_DIR))) {
		return [];
	}

	const projectDirs = await readdir(PROJECTS_DIR);
	const allSessions: SessionInfo[] = [];

	for (const encoded of projectDirs) {
		const projectDir = join(PROJECTS_DIR, encoded);
		if (!(await dirExists(projectDir))) continue;

		const index = await readSessionsIndex(projectDir);

		if (index) {
			for (const entry of index.sessions) {
				const jsonlPath = join(projectDir, `${entry.sessionId}.jsonl`);
				const _exists = await fileExists(jsonlPath);
				allSessions.push({
					sessionId: entry.sessionId,
					projectPath: decodeProjectPath(encoded),
					encodedPath: encoded,
					jsonlPath,
					name: entry.name,
					created: entry.created ? new Date(entry.created) : undefined,
					modified: entry.modified ? new Date(entry.modified) : undefined,
					lastCwd: entry.lastCwd,
				});
			}
		} else {
			// Fallback: scan for .jsonl files
			const scanned = await scanJsonlFiles(projectDir);
			allSessions.push(...scanned);
		}
	}

	// Sort by modified date, most recent first
	allSessions.sort((a, b) => {
		const aTime = a.modified?.getTime() ?? 0;
		const bTime = b.modified?.getTime() ?? 0;
		return bTime - aTime;
	});

	return allSessions;
}

/**
 * Find sessions for a specific project directory (by CWD).
 */
export async function listSessionsForProject(cwd: string): Promise<SessionInfo[]> {
	const encoded = encodeProjectPath(cwd);
	const projectDir = join(PROJECTS_DIR, encoded);

	if (!(await dirExists(projectDir))) {
		return [];
	}

	const index = await readSessionsIndex(projectDir);

	if (index) {
		const sessions: SessionInfo[] = [];
		for (const entry of index.sessions) {
			const jsonlPath = join(projectDir, `${entry.sessionId}.jsonl`);
			sessions.push({
				sessionId: entry.sessionId,
				projectPath: cwd,
				encodedPath: encoded,
				jsonlPath,
				name: entry.name,
				created: entry.created ? new Date(entry.created) : undefined,
				modified: entry.modified ? new Date(entry.modified) : undefined,
				lastCwd: entry.lastCwd,
			});
		}
		sessions.sort((a, b) => {
			const aTime = a.modified?.getTime() ?? 0;
			const bTime = b.modified?.getTime() ?? 0;
			return bTime - aTime;
		});
		return sessions;
	}

	return scanJsonlFiles(projectDir);
}

export interface ResolveSessionOptions {
	sessionId?: string;
	cwd?: string;
}

/**
 * Main entry point for resolving a session.
 * - With --session: prefix-match across all projects
 * - Without: find project dir for CWD, return most recent
 */
export async function resolveSession(
	opts: ResolveSessionOptions = {},
): Promise<SessionInfo | null> {
	if (opts.sessionId) {
		// Prefix match across all sessions
		const all = await listAllSessions();
		const prefix = opts.sessionId;
		const match = all.find((s) => s.sessionId.startsWith(prefix));
		return match ?? null;
	}

	// Find by CWD
	const cwd = opts.cwd ?? process.cwd();
	const sessions = await listSessionsForProject(cwd);

	if (sessions.length > 0) {
		return sessions[0]; // Most recent
	}

	// Fallback: search all sessions for matching project path
	const all = await listAllSessions();
	const cwdResolved = resolve(cwd);
	const match = all.find((s) => {
		const decoded = decodeProjectPath(s.encodedPath);
		return decoded === cwdResolved;
	});

	return match ?? null;
}

/**
 * Get the first user message from a JSONL file (for session preview).
 */
export async function getSessionPreview(jsonlPath: string): Promise<string | null> {
	try {
		const content = await readFile(jsonlPath, "utf-8");
		const lines = content.split("\n");

		for (const rawLine of lines) {
			const line = parseLine(rawLine);
			if (!line) continue;
			if (line.type === "user" && line.message?.content) {
				const content = line.message.content;
				if (typeof content === "string") {
					return content.slice(0, 120);
				}
				// Array of content blocks
				for (const block of content) {
					if ("text" in block && block.type === "text") {
						return block.text.slice(0, 120);
					}
				}
			}
		}
		return null;
	} catch {
		return null;
	}
}
