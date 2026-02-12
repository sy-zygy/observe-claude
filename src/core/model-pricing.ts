/** Pricing per million tokens in USD */
interface ModelPricing {
	inputPerMillion: number;
	outputPerMillion: number;
	cacheCreationPerMillion: number;
	cacheReadPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
	// Claude 4.x / Opus
	"claude-opus-4-6": {
		inputPerMillion: 15,
		outputPerMillion: 75,
		cacheCreationPerMillion: 18.75,
		cacheReadPerMillion: 1.5,
	},
	"claude-opus-4-0-20250514": {
		inputPerMillion: 15,
		outputPerMillion: 75,
		cacheCreationPerMillion: 18.75,
		cacheReadPerMillion: 1.5,
	},
	// Claude 4.5 / Sonnet
	"claude-sonnet-4-5-20250929": {
		inputPerMillion: 3,
		outputPerMillion: 15,
		cacheCreationPerMillion: 3.75,
		cacheReadPerMillion: 0.3,
	},
	// Claude 4.0 / Sonnet
	"claude-sonnet-4-0-20250514": {
		inputPerMillion: 3,
		outputPerMillion: 15,
		cacheCreationPerMillion: 3.75,
		cacheReadPerMillion: 0.3,
	},
	// Claude 3.5 Sonnet
	"claude-sonnet-4-5-20250514": {
		inputPerMillion: 3,
		outputPerMillion: 15,
		cacheCreationPerMillion: 3.75,
		cacheReadPerMillion: 0.3,
	},
	"claude-3-5-sonnet-20241022": {
		inputPerMillion: 3,
		outputPerMillion: 15,
		cacheCreationPerMillion: 3.75,
		cacheReadPerMillion: 0.3,
	},
	// Claude 4.5 / Haiku
	"claude-haiku-4-5-20251001": {
		inputPerMillion: 0.8,
		outputPerMillion: 4,
		cacheCreationPerMillion: 1,
		cacheReadPerMillion: 0.08,
	},
	// Claude 3.5 Haiku
	"claude-3-5-haiku-20241022": {
		inputPerMillion: 0.8,
		outputPerMillion: 4,
		cacheCreationPerMillion: 1,
		cacheReadPerMillion: 0.08,
	},
};

/** Default pricing if model isn't recognized (use Sonnet pricing as safe default) */
const DEFAULT_PRICING: ModelPricing = {
	inputPerMillion: 3,
	outputPerMillion: 15,
	cacheCreationPerMillion: 3.75,
	cacheReadPerMillion: 0.3,
};

/**
 * Get pricing for a model. Falls back to Sonnet pricing for unknown models.
 * Does prefix matching — "claude-sonnet-4-5-20250514" matches even if passed
 * a longer model ID.
 */
export function getModelPricing(model: string): ModelPricing {
	// Exact match
	if (PRICING[model]) return PRICING[model];

	// Prefix match
	for (const [key, pricing] of Object.entries(PRICING)) {
		if (model.startsWith(key) || key.startsWith(model)) {
			return pricing;
		}
	}

	return DEFAULT_PRICING;
}

/** Calculate cost in USD for a given token count and model */
export function calculateCost(
	model: string,
	inputTokens: number,
	outputTokens: number,
	cacheCreationTokens = 0,
	cacheReadTokens = 0,
): number {
	const pricing = getModelPricing(model);
	return (
		(inputTokens * pricing.inputPerMillion) / 1_000_000 +
		(outputTokens * pricing.outputPerMillion) / 1_000_000 +
		(cacheCreationTokens * pricing.cacheCreationPerMillion) / 1_000_000 +
		(cacheReadTokens * pricing.cacheReadPerMillion) / 1_000_000
	);
}
