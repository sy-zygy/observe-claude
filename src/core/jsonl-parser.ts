import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import type {
	AssistantMessage,
	ConsolidatedAssistantMessage,
	ContentBlock,
	JsonlLine,
} from "./types.js";

/**
 * Parse a single JSONL line into a typed object.
 * Returns null for unparseable lines (blank, malformed JSON).
 */
export function parseLine(raw: string): JsonlLine | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	try {
		const parsed = JSON.parse(trimmed);
		if (parsed && typeof parsed === "object" && "type" in parsed) {
			return parsed as JsonlLine;
		}
		// Some lines may not have a `type` field — try to infer
		if (parsed?.message?.role === "assistant") {
			return { type: "assistant", ...parsed } as AssistantMessage;
		}
		if (parsed?.message?.role === "user") {
			return { type: "user", ...parsed } as JsonlLine;
		}
		if (parsed?.message?.role === "system") {
			return { type: "system", ...parsed } as JsonlLine;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Async generator that yields parsed JSONL lines from a file.
 */
export async function* parseJsonlFile(path: string): AsyncGenerator<JsonlLine> {
	const content = await readFile(path, "utf-8");
	for (const rawLine of content.split("\n")) {
		const line = parseLine(rawLine);
		if (line) yield line;
	}
}

/**
 * Read all lines from a JSONL file into an array.
 */
export async function readJsonlLines(path: string): Promise<JsonlLine[]> {
	const lines: JsonlLine[] = [];
	for await (const line of parseJsonlFile(path)) {
		lines.push(line);
	}
	return lines;
}

/**
 * Consolidate streaming assistant message chunks by message.id.
 * Multiple JSONL lines with the same message.id each carry one content block.
 * We merge all content blocks and take the usage from the last chunk.
 */
export function consolidateAssistantMessages(lines: JsonlLine[]): ConsolidatedAssistantMessage[] {
	const groupMap = new Map<string, AssistantMessage[]>();
	const order: string[] = [];

	for (const line of lines) {
		if (line.type !== "assistant") continue;
		const msg = line as AssistantMessage;
		const id = msg.message?.id;
		if (!id) continue;

		if (!groupMap.has(id)) {
			groupMap.set(id, []);
			order.push(id);
		}
		groupMap.get(id)?.push(msg);
	}

	const results: ConsolidatedAssistantMessage[] = [];

	for (const id of order) {
		const chunks = groupMap.get(id);
		if (!chunks) continue;
		const allContent: ContentBlock[] = [];

		for (const chunk of chunks) {
			if (chunk.message?.content) {
				allContent.push(...chunk.message.content);
			}
		}

		const last = chunks[chunks.length - 1];

		results.push({
			id,
			model: last.message.model,
			content: allContent,
			usage: last.message.usage ?? {
				input_tokens: 0,
				output_tokens: 0,
			},
			stopReason: last.message.stop_reason,
			costUSD: last.costUSD,
			durationMs: last.durationMs,
		});
	}

	return results;
}

/**
 * JsonlTailer — watches a JSONL file and emits "line" events for new lines.
 * Uses chokidar for file watching and handles file truncation (compaction).
 */
export class JsonlTailer extends EventEmitter {
	private path: string;
	private offset = 0;
	private watcher: unknown = null;
	private closed = false;

	constructor(path: string) {
		super();
		this.path = path;
	}

	async start(): Promise<void> {
		// Read existing content to set initial offset
		try {
			const content = await readFile(this.path, "utf-8");
			this.offset = Buffer.byteLength(content, "utf-8");
			// Parse existing lines
			for (const rawLine of content.split("\n")) {
				const line = parseLine(rawLine);
				if (line) this.emit("line", line);
			}
		} catch {
			// File may not exist yet
			this.offset = 0;
		}

		// Dynamic import chokidar to avoid issues if not installed
		const { watch } = await import("chokidar");
		const w = watch(this.path, {
			persistent: true,
			usePolling: false,
			awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
		});

		this.watcher = w;

		w.on("change", async () => {
			if (this.closed) return;
			await this.readNewLines();
		});
	}

	private async readNewLines(): Promise<void> {
		try {
			const content = await readFile(this.path, "utf-8");
			const totalBytes = Buffer.byteLength(content, "utf-8");

			// File was truncated (compaction)
			if (totalBytes < this.offset) {
				this.offset = 0;
				this.emit("truncated");
			}

			const newContent = Buffer.from(content, "utf-8").subarray(this.offset).toString("utf-8");
			this.offset = totalBytes;

			if (!newContent) return;

			for (const rawLine of newContent.split("\n")) {
				const line = parseLine(rawLine);
				if (line) this.emit("line", line);
			}
		} catch {
			// File may have been deleted
		}
	}

	async stop(): Promise<void> {
		this.closed = true;
		if (this.watcher && typeof (this.watcher as { close(): Promise<void> }).close === "function") {
			await (this.watcher as { close(): Promise<void> }).close();
		}
		this.removeAllListeners();
	}
}
