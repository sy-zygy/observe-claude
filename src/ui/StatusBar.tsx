import { Box, Text } from "ink";
import { colors, formatTimestamp, shades } from "./theme.js";

interface StatusBarProps {
	lastUpdate?: Date | null;
	eventCount?: number;
	hooksActive?: boolean;
}

export function StatusBar({ lastUpdate, eventCount, hooksActive }: StatusBarProps) {
	const parts: string[] = [];

	if (lastUpdate) {
		parts.push(`updated ${formatTimestamp(lastUpdate)}`);
	}

	if (eventCount !== undefined) {
		parts.push(`${eventCount} events`);
	}

	if (hooksActive) {
		parts.push("hooks: active");
	}

	return (
		<Box marginTop={1}>
			<Text color={colors.dim}>
				{shades.light}
				{shades.medium}
				{shades.dark} {parts.join(" │ ")} {shades.dark}
				{shades.medium}
				{shades.light}
			</Text>
			<Text color={colors.dim}> (s: sessions, q: quit)</Text>
		</Box>
	);
}
