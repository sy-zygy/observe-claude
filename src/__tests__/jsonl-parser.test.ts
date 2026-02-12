import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { consolidateAssistantMessages, parseLine, readJsonlLines } from "../core/jsonl-parser.js";
import type { AssistantMessage, SystemMessage, UserMessage } from "../core/types.js";

const FIXTURES = join(import.meta.dirname, "..", "__fixtures__");

describe("parseLine", () => {
	it("parses a user message", () => {
		const raw = JSON.stringify({
			type: "user",
			message: { role: "user", content: "Hello" },
		});
		const line = parseLine(raw);
		expect(line).not.toBeNull();
		expect(line?.type).toBe("user");
		expect((line as UserMessage).message.content).toBe("Hello");
	});

	it("parses an assistant message", () => {
		const raw = JSON.stringify({
			type: "assistant",
			message: {
				id: "msg_001",
				type: "message",
				role: "assistant",
				content: [{ type: "text", text: "Hi there" }],
				model: "claude-sonnet-4-5-20250514",
				stop_reason: "end_turn",
				stop_sequence: null,
				usage: { input_tokens: 100, output_tokens: 50 },
			},
		});
		const line = parseLine(raw);
		expect(line).not.toBeNull();
		expect(line?.type).toBe("assistant");
		const msg = line as AssistantMessage;
		expect(msg.message.id).toBe("msg_001");
		expect(msg.message.usage.input_tokens).toBe(100);
	});

	it("parses a system message with compact_boundary", () => {
		const raw = JSON.stringify({
			type: "system",
			message: { role: "system", content: "Context compacted." },
			compact_boundary: true,
		});
		const line = parseLine(raw);
		expect(line).not.toBeNull();
		expect(line?.type).toBe("system");
		expect((line as SystemMessage).compact_boundary).toBe(true);
	});

	it("returns null for empty lines", () => {
		expect(parseLine("")).toBeNull();
		expect(parseLine("   ")).toBeNull();
	});

	it("returns null for malformed JSON", () => {
		expect(parseLine("{not json")).toBeNull();
	});

	it("returns null for objects without type or role", () => {
		expect(parseLine(JSON.stringify({ foo: "bar" }))).toBeNull();
	});
});

describe("readJsonlLines", () => {
	it("reads the sample session fixture", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		expect(lines.length).toBeGreaterThan(0);

		const types = lines.map((l) => l.type);
		expect(types).toContain("user");
		expect(types).toContain("assistant");
		expect(types).toContain("system");
	});
});

describe("consolidateAssistantMessages", () => {
	it("groups streaming chunks by message.id", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const consolidated = consolidateAssistantMessages(lines);

		// msg_001 has 3 chunks, msg_002 has 1, msg_003 has 1
		expect(consolidated).toHaveLength(3);

		// First message should have all 3 content blocks merged
		const first = consolidated[0];
		expect(first.id).toBe("msg_001");
		expect(first.content).toHaveLength(3);
		expect(first.content[0].type).toBe("thinking");
		expect(first.content[1].type).toBe("text");
		expect(first.content[2].type).toBe("tool_use");

		// Usage should be from the last chunk
		expect(first.usage.output_tokens).toBe(180);
		expect(first.costUSD).toBe(0.012);
		expect(first.durationMs).toBe(3500);
	});

	it("preserves single-chunk messages as-is", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const consolidated = consolidateAssistantMessages(lines);

		const msg002 = consolidated[1];
		expect(msg002.id).toBe("msg_002");
		expect(msg002.content).toHaveLength(1);
		expect(msg002.usage.input_tokens).toBe(2000);
	});
});
