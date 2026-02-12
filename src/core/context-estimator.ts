import type { AssistantMessage, ContextEstimate, JsonlLine, SystemMessage } from "./types.js";

const DEFAULT_MAX_TOKENS = 200_000;

export interface ContextEstimator {
	processLine(line: JsonlLine): void;
	getEstimate(): ContextEstimate;
	reset(): void;
}

/**
 * Estimate context window usage from assistant message token fields.
 *
 * Uses cache_creation_input_tokens + cache_read_input_tokens + input_tokens
 * from the last assistant message's usage as the current context size.
 *
 * Resets on compact_boundary system messages.
 */
export function createContextEstimator(maxTokens = DEFAULT_MAX_TOKENS): ContextEstimator {
	let currentTokens = 0;
	let compactionCount = 0;
	/** Track the last seen message ID to handle streaming chunks */
	let _lastMessageId: string | null = null;

	function processLine(line: JsonlLine): void {
		if (line.type === "system") {
			const sys = line as SystemMessage;
			if (sys.compact_boundary) {
				compactionCount++;
				currentTokens = 0;
				_lastMessageId = null;
			}
			return;
		}

		if (line.type === "assistant") {
			const msg = line as AssistantMessage;
			const id = msg.message?.id;
			const usage = msg.message?.usage;
			if (!usage) return;

			// For streaming chunks with the same ID, update (don't accumulate)
			// The last chunk has the final usage values
			const totalPrompt =
				(usage.input_tokens ?? 0) +
				(usage.cache_creation_input_tokens ?? 0) +
				(usage.cache_read_input_tokens ?? 0);

			if (totalPrompt > 0) {
				currentTokens = totalPrompt;
				_lastMessageId = id ?? null;
			}
		}
	}

	function getEstimate(): ContextEstimate {
		const percentUsed = maxTokens > 0 ? (currentTokens / maxTokens) * 100 : 0;
		return {
			currentTokens,
			maxTokens,
			percentUsed: Math.min(percentUsed, 100),
			compactionCount,
		};
	}

	function reset(): void {
		currentTokens = 0;
		compactionCount = 0;
		_lastMessageId = null;
	}

	return { processLine, getEstimate, reset };
}
