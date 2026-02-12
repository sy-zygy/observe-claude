import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createContextEstimator } from "../core/context-estimator.js";
import { readJsonlLines } from "../core/jsonl-parser.js";

const FIXTURES = join(import.meta.dirname, "..", "__fixtures__");

describe("ContextEstimator", () => {
	it("estimates context usage from the last assistant message", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const estimator = createContextEstimator();

		for (const line of lines) {
			estimator.processLine(line);
		}

		const estimate = estimator.getEstimate();

		// After compaction, msg_003 has: input=800 + cache_create=600 + cache_read=100 = 1500
		expect(estimate.currentTokens).toBe(800 + 600 + 100);
		expect(estimate.maxTokens).toBe(200_000);
		expect(estimate.percentUsed).toBeCloseTo(0.75, 1);
		expect(estimate.compactionCount).toBe(1);
	});

	it("resets on compact_boundary", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const estimator = createContextEstimator();

		// Process up to and including compaction (index 7 is compact_boundary)
		for (let i = 0; i < 8; i++) {
			estimator.processLine(lines[i]);
		}

		// After compaction, context should have been reset
		const midEstimate = estimator.getEstimate();
		expect(midEstimate.compactionCount).toBe(1);
		expect(midEstimate.currentTokens).toBe(0);

		// Process post-compaction message (index 8)
		estimator.processLine(lines[8]);
		const finalEstimate = estimator.getEstimate();
		expect(finalEstimate.currentTokens).toBe(800 + 600 + 100);
	});

	it("handles streaming chunks correctly (uses latest, not cumulative)", () => {
		const estimator = createContextEstimator();

		// Simulate 3 streaming chunks for the same message
		estimator.processLine({
			type: "assistant",
			message: {
				id: "msg_x",
				type: "message",
				role: "assistant",
				content: [{ type: "text", text: "chunk 1" }],
				model: "claude-sonnet-4-5-20250514",
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: 1000, output_tokens: 10 },
			},
		});

		estimator.processLine({
			type: "assistant",
			message: {
				id: "msg_x",
				type: "message",
				role: "assistant",
				content: [{ type: "text", text: "chunk 2" }],
				model: "claude-sonnet-4-5-20250514",
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: 1000, output_tokens: 50 },
			},
		});

		estimator.processLine({
			type: "assistant",
			message: {
				id: "msg_x",
				type: "message",
				role: "assistant",
				content: [{ type: "text", text: "chunk 3" }],
				model: "claude-sonnet-4-5-20250514",
				stop_reason: "end_turn",
				stop_sequence: null,
				usage: { input_tokens: 1000, output_tokens: 100 },
			},
		});

		const estimate = estimator.getEstimate();
		// Should be 1000 (input from last), not 3000 (cumulative)
		expect(estimate.currentTokens).toBe(1000);
	});
});
