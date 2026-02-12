import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readJsonlLines } from "../core/jsonl-parser.js";
import { createUsageAggregator } from "../core/usage-aggregator.js";

const FIXTURES = join(import.meta.dirname, "..", "__fixtures__");

describe("UsageAggregator", () => {
	it("aggregates tokens without double-counting streaming chunks", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const aggregator = createUsageAggregator();

		for (const line of lines) {
			aggregator.processLine(line);
		}

		const totals = aggregator.getTotals();

		// msg_001 has 3 chunks, but usage should only count once (last chunk)
		// msg_001: input=1500, output=180, cache_create=1000, cache_read=200
		// msg_002: input=2000, output=250, cache_create=1200, cache_read=500
		// msg_003: input=800, output=100, cache_create=600, cache_read=100
		expect(totals.inputTokens).toBe(1500 + 2000 + 800);
		expect(totals.outputTokens).toBe(180 + 250 + 100);
		expect(totals.cacheCreationTokens).toBe(1000 + 1200 + 600);
		expect(totals.cacheReadTokens).toBe(200 + 500 + 100);

		// 3 unique message IDs
		expect(totals.messageCount).toBe(3);
	});

	it("resets properly", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const aggregator = createUsageAggregator();

		for (const line of lines) {
			aggregator.processLine(line);
		}

		aggregator.reset();
		const totals = aggregator.getTotals();

		expect(totals.inputTokens).toBe(0);
		expect(totals.outputTokens).toBe(0);
		expect(totals.messageCount).toBe(0);
		expect(totals.totalCostUSD).toBe(0);
	});

	it("calculates a non-zero cost", async () => {
		const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"));
		const aggregator = createUsageAggregator();

		for (const line of lines) {
			aggregator.processLine(line);
		}

		const totals = aggregator.getTotals();
		expect(totals.totalCostUSD).toBeGreaterThan(0);
	});
});
