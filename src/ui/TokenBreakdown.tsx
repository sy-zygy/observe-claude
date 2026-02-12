import { Box, Text } from "ink";
import type { ContextEstimate } from "../core/types.js";
import { colors, formatTokens, progressChars } from "./theme.js";

interface TokenBreakdownProps {
	estimate: ContextEstimate;
}

export function TokenBreakdown({ estimate }: TokenBreakdownProps) {
	const { currentTokens, maxTokens } = estimate;
	const used = currentTokens;
	const free = Math.max(0, maxTokens - currentTokens);

	const barWidth = 40;
	const usedWidth = Math.round((used / maxTokens) * barWidth);
	const freeWidth = barWidth - usedWidth;

	const usedBar = progressChars.full.repeat(usedWidth);
	const freeBar = progressChars.quarter.repeat(freeWidth);

	const usedColor =
		estimate.percentUsed > 90
			? colors.error
			: estimate.percentUsed > 70
				? colors.warning
				: colors.primary;

	return (
		<Box flexDirection="column">
			<Text color={colors.dim}>Token breakdown:</Text>
			<Box>
				<Text color={colors.dim}> Used </Text>
				<Text color={usedColor}>{usedBar}</Text>
				<Text color={colors.dim}>{freeBar}</Text>
				<Text color={usedColor}> {formatTokens(used)}</Text>
			</Box>
			<Box>
				<Text color={colors.dim}> Free </Text>
				<Text color={colors.dim}>{progressChars.quarter.repeat(usedWidth)}</Text>
				<Text color={colors.secondary}>{progressChars.half.repeat(freeWidth)}</Text>
				<Text color={colors.secondary}> {formatTokens(free)}</Text>
			</Box>
		</Box>
	);
}
