import { calculateCost } from "./model-pricing.js";
import type { AssistantMessage, JsonlLine, UsageTotals } from "./types.js";

export interface UsageAggregator {
	processLine(line: JsonlLine): void;
	getTotals(): UsageTotals;
	reset(): void;
}

/**
 * Aggregates token usage across assistant messages.
 * Groups by message.id to avoid double-counting streaming chunks.
 * Only counts usage from the last chunk of each message ID.
 */
export function createUsageAggregator(): UsageAggregator {
	let totals: UsageTotals = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		totalCostUSD: 0,
		messageCount: 0,
		seenMessageIds: new Set(),
	};

	/** Track the latest usage per message ID (for streaming consolidation) */
	const messageUsage = new Map<
		string,
		{ input: number; output: number; cacheCreate: number; cacheRead: number; model: string }
	>();

	function processLine(line: JsonlLine): void {
		if (line.type !== "assistant") return;

		const msg = line as AssistantMessage;
		const id = msg.message?.id;
		const usage = msg.message?.usage;
		const model = msg.message?.model ?? "";
		if (!id || !usage) return;

		const current = {
			input: usage.input_tokens ?? 0,
			output: usage.output_tokens ?? 0,
			cacheCreate: usage.cache_creation_input_tokens ?? 0,
			cacheRead: usage.cache_read_input_tokens ?? 0,
			model,
		};

		const prev = messageUsage.get(id);

		if (prev) {
			// Subtract previous values (we'll add the new ones)
			totals.inputTokens -= prev.input;
			totals.outputTokens -= prev.output;
			totals.cacheCreationTokens -= prev.cacheCreate;
			totals.cacheReadTokens -= prev.cacheRead;
			totals.totalCostUSD -= calculateCost(
				prev.model,
				prev.input,
				prev.output,
				prev.cacheCreate,
				prev.cacheRead,
			);
		} else {
			totals.messageCount++;
			totals.seenMessageIds.add(id);
		}

		messageUsage.set(id, current);

		totals.inputTokens += current.input;
		totals.outputTokens += current.output;
		totals.cacheCreationTokens += current.cacheCreate;
		totals.cacheReadTokens += current.cacheRead;
		totals.totalCostUSD += calculateCost(
			model,
			current.input,
			current.output,
			current.cacheCreate,
			current.cacheRead,
		);
	}

	function getTotals(): UsageTotals {
		return { ...totals };
	}

	function reset(): void {
		totals = {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationTokens: 0,
			cacheReadTokens: 0,
			totalCostUSD: 0,
			messageCount: 0,
			seenMessageIds: new Set(),
		};
		messageUsage.clear();
	}

	return { processLine, getTotals, reset };
}
