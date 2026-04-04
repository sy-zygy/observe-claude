import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { SessionInfo } from "../core/types.js";
import { colors, formatRelativeTime, shades } from "./theme.js";

interface SessionPickerProps {
	sessions: SessionInfo[];
	onSelect: (session: SessionInfo) => void;
}

export function SessionPicker({ sessions, onSelect }: SessionPickerProps) {
	const [cursor, setCursor] = useState(0);

	useInput((_input, key) => {
		if (key.upArrow) {
			setCursor((prev) => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setCursor((prev) => Math.min(sessions.length - 1, prev + 1));
		} else if (key.return) {
			onSelect(sessions[cursor]);
		}
	});

	return (
		<Box flexDirection="column">
			<Text color={colors.warning}>
				{shades.light}
				{shades.medium}
				{shades.dark} Multiple sessions found for this project {shades.dark}
				{shades.medium}
				{shades.light}
			</Text>
			<Text color={colors.dim}>Use ↑↓ to select, Enter to confirm</Text>
			<Box flexDirection="column" marginTop={1}>
				{sessions.map((session, idx) => {
					const selected = idx === cursor;
					const idShort = session.sessionId.slice(0, 8);
					const modified = session.modified ? formatRelativeTime(session.modified) : "unknown";
					const project = session.projectPath.split("/").filter(Boolean).slice(-2).join("/");

					return (
						<Box key={session.sessionId}>
							<Text color={selected ? colors.accent : colors.dim}>{selected ? "▸ " : "  "}</Text>
							<Text color={selected ? colors.secondary : colors.text} bold={selected}>
								{idShort}
							</Text>
							<Text color={colors.dim}>{" │ "}</Text>
							<Text color={selected ? colors.text : colors.dim}>{modified.padEnd(10)}</Text>
							<Text color={colors.dim}>{" │ "}</Text>
							<Text color={selected ? colors.primary : colors.dim}>{project}</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
