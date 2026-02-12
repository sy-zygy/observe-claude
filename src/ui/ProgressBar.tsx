import { Box, Text } from "ink";
import { colors, progressChars } from "./theme.js";

interface ProgressBarProps {
	value: number; // 0-100
	width?: number;
	color?: string;
	label?: string;
}

export function ProgressBar({
	value,
	width = 40,
	color = colors.primary,
	label,
}: ProgressBarProps) {
	const clamped = Math.max(0, Math.min(100, value));
	const filledWidth = Math.round((clamped / 100) * width);
	const emptyWidth = width - filledWidth;

	// Build the bar using block characters
	let bar = "";
	for (let i = 0; i < filledWidth; i++) {
		if (i < filledWidth - 1) {
			bar += progressChars.full;
		} else {
			// Use gradient at the boundary
			const frac = (clamped / 100) * width - filledWidth + 1;
			if (frac > 0.75) bar += progressChars.full;
			else if (frac > 0.5) bar += progressChars.threequarter;
			else if (frac > 0.25) bar += progressChars.half;
			else bar += progressChars.quarter;
		}
	}
	for (let i = 0; i < emptyWidth; i++) {
		bar += progressChars.quarter;
	}

	return (
		<Box>
			<Text color={colors.dim}>{"["}</Text>
			<Text color={color}>{bar}</Text>
			<Text color={colors.dim}>{"]"}</Text>
			{label && (
				<Text color={color} bold>
					{" "}
					{label}
				</Text>
			)}
		</Box>
	);
}
