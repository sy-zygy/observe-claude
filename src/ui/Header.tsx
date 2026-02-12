import { Box, Text } from "ink";
import { BANNER_COMPACT, DIVIDER, FULL_BANNER, TITLE } from "./AsciiArt.js";
import { colors } from "./theme.js";

interface HeaderProps {
	compact?: boolean;
	/** Show the large eye logo above the title */
	showEye?: boolean;
	sessionId?: string;
	projectPath?: string;
	subtitle?: string;
}

export function Header({
	compact = false,
	showEye = false,
	sessionId,
	projectPath,
	subtitle,
}: HeaderProps) {
	if (compact) {
		return (
			<Box flexDirection="column">
				<Text color={colors.primary}>{BANNER_COMPACT}</Text>
				{sessionId && (
					<Text>
						<Text color={colors.dim}>session: </Text>
						<Text color={colors.secondary}>{sessionId.slice(0, 8)}</Text>
						{projectPath && (
							<>
								<Text color={colors.dim}> │ </Text>
								<Text color={colors.text}>{projectPath}</Text>
							</>
						)}
					</Text>
				)}
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text color={colors.primary}>{showEye ? FULL_BANNER : TITLE}</Text>
			<Text color={colors.accent}>{DIVIDER}</Text>
			{sessionId && (
				<Box marginTop={1}>
					<Text>
						<Text color={colors.dim}>session: </Text>
						<Text color={colors.secondary}>{sessionId.slice(0, 8)}...</Text>
					</Text>
				</Box>
			)}
			{projectPath && (
				<Text>
					<Text color={colors.dim}>project: </Text>
					<Text color={colors.text}>{projectPath}</Text>
				</Text>
			)}
			{subtitle && <Text color={colors.warning}>{subtitle}</Text>}
		</Box>
	);
}
