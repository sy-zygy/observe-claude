import { Box, Text } from "ink";
import { colors } from "./theme.js";

interface LogLine {
	text: string;
	color?: string;
}

interface ScrollingLogProps {
	lines: LogLine[];
	maxVisible?: number;
}

export function ScrollingLog({ lines, maxVisible = 20 }: ScrollingLogProps) {
	const visible = lines.slice(-maxVisible);
	const skipped = lines.length - visible.length;

	return (
		<Box flexDirection="column">
			{skipped > 0 && <Text color={colors.dim}> ↑ {skipped} more lines above</Text>}
			{visible.map((line, idx) => (
				<Text key={idx} color={line.color ?? colors.text}>
					{"  "}
					{line.text}
				</Text>
			))}
			{visible.length === 0 && <Text color={colors.dim}> Waiting for events...</Text>}
		</Box>
	);
}
