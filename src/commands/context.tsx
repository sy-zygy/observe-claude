import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { createContextEstimator } from "../core/context-estimator.js";
import { JsonlTailer } from "../core/jsonl-parser.js";
import type { ContextEstimate, JsonlLine, SessionInfo } from "../core/types.js";
import { Header } from "../ui/Header.js";
import { ProgressBar } from "../ui/ProgressBar.js";
import { SessionPicker } from "../ui/SessionPicker.js";
import { StatusBar } from "../ui/StatusBar.js";
import { TokenBreakdown } from "../ui/TokenBreakdown.js";
import { colors, formatTokens } from "../ui/theme.js";
import { useSessionResolver } from "../ui/useSessionResolver.js";

interface ContextAppProps {
	session?: string;
	/** Show the large eye logo (used by launch command for top-left pane) */
	banner?: boolean;
}

export function ContextApp({ session, banner = false }: ContextAppProps) {
	const { state: sessionState, pick } = useSessionResolver(session);

	if (sessionState.status === "loading") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="context" />
				<Text color={colors.warning}>░▒▓ Resolving session... ▓▒░</Text>
			</Box>
		);
	}

	if (sessionState.status === "error") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="context" />
				<Text color={colors.error}>Error: {sessionState.message}</Text>
			</Box>
		);
	}

	if (sessionState.status === "pick") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="context" />
				<Box marginTop={1}>
					<SessionPicker sessions={sessionState.sessions} onSelect={pick} />
				</Box>
			</Box>
		);
	}

	return <ContextView session={sessionState.session} banner={banner} />;
}

function ContextView({ session, banner }: { session: SessionInfo; banner: boolean }) {
	const [estimate, setEstimate] = useState<ContextEstimate>({
		currentTokens: 0,
		maxTokens: 200_000,
		percentUsed: 0,
		compactionCount: 0,
	});
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		let tailer: JsonlTailer | null = null;

		(async () => {
			const estimator = createContextEstimator();
			tailer = new JsonlTailer(session.jsonlPath);

			tailer.on("line", (line: JsonlLine) => {
				estimator.processLine(line);
				setEstimate(estimator.getEstimate());
				setLastUpdate(new Date());
			});

			tailer.on("truncated", () => {
				estimator.reset();
				setEstimate(estimator.getEstimate());
			});

			await tailer.start();
		})();

		return () => {
			tailer?.stop();
		};
	}, [session.jsonlPath]);

	const warningLevel =
		estimate.percentUsed > 90 ? "critical" : estimate.percentUsed > 70 ? "warning" : "normal";

	const barColor =
		warningLevel === "critical"
			? colors.error
			: warningLevel === "warning"
				? colors.warning
				: colors.primary;

	return (
		<Box flexDirection="column">
			{banner ? (
				<Header
					showEye
					sessionId={session.sessionId}
					projectPath={session.projectPath}
					subtitle="context window"
				/>
			) : (
				<Header
					compact
					sessionId={session.sessionId}
					projectPath={session.projectPath}
					subtitle="context window"
				/>
			)}

			<Box marginTop={1} flexDirection="column">
				<Text color={colors.secondary} bold>
					╔══ Context Window Usage ══╗
				</Text>

				<Box marginTop={1}>
					<ProgressBar
						value={estimate.percentUsed}
						width={50}
						color={barColor}
						label={`${estimate.percentUsed.toFixed(1)}%`}
					/>
				</Box>

				<Box marginTop={1}>
					<Text>
						<Text color={colors.dim}>Tokens: </Text>
						<Text color={barColor} bold>
							{formatTokens(estimate.currentTokens)}
						</Text>
						<Text color={colors.dim}> / {formatTokens(estimate.maxTokens)}</Text>
					</Text>
				</Box>

				<Box marginTop={1}>
					<TokenBreakdown estimate={estimate} />
				</Box>

				{estimate.compactionCount > 0 && (
					<Box marginTop={1}>
						<Text color={colors.warning}>⚡ Compactions: {estimate.compactionCount}</Text>
					</Box>
				)}
			</Box>

			<StatusBar lastUpdate={lastUpdate} />
		</Box>
	);
}
