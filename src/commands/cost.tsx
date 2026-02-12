import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { JsonlTailer } from "../core/jsonl-parser.js";
import type { JsonlLine, SessionInfo, UsageTotals } from "../core/types.js";
import { createUsageAggregator } from "../core/usage-aggregator.js";
import { Header } from "../ui/Header.js";
import { SessionPicker } from "../ui/SessionPicker.js";
import { StatusBar } from "../ui/StatusBar.js";
import { colors, formatCost, formatTokens } from "../ui/theme.js";
import { useSessionResolver } from "../ui/useSessionResolver.js";

interface CostAppProps {
	session?: string;
}

export function CostApp({ session }: CostAppProps) {
	const { state: sessionState, pick } = useSessionResolver(session);

	if (sessionState.status === "loading") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="cost" />
				<Text color={colors.warning}>░▒▓ Resolving session... ▓▒░</Text>
			</Box>
		);
	}

	if (sessionState.status === "error") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="cost" />
				<Text color={colors.error}>Error: {sessionState.message}</Text>
			</Box>
		);
	}

	if (sessionState.status === "pick") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="cost" />
				<Box marginTop={1}>
					<SessionPicker sessions={sessionState.sessions} onSelect={pick} />
				</Box>
			</Box>
		);
	}

	return <CostView session={sessionState.session} />;
}

const EMPTY_TOTALS: UsageTotals = {
	inputTokens: 0,
	outputTokens: 0,
	cacheCreationTokens: 0,
	cacheReadTokens: 0,
	totalCostUSD: 0,
	messageCount: 0,
	seenMessageIds: new Set(),
};

function CostView({ session }: { session: SessionInfo }) {
	const [totals, setTotals] = useState<UsageTotals>(EMPTY_TOTALS);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		let tailer: JsonlTailer | null = null;

		(async () => {
			const aggregator = createUsageAggregator();
			tailer = new JsonlTailer(session.jsonlPath);

			tailer.on("line", (line: JsonlLine) => {
				aggregator.processLine(line);
				setTotals({ ...aggregator.getTotals() });
				setLastUpdate(new Date());
			});

			tailer.on("truncated", () => {
				aggregator.reset();
				setTotals({ ...aggregator.getTotals() });
			});

			await tailer.start();
		})();

		return () => {
			tailer?.stop();
		};
	}, [session.jsonlPath]);

	const totalTokens =
		totals.inputTokens + totals.outputTokens + totals.cacheCreationTokens + totals.cacheReadTokens;

	return (
		<Box flexDirection="column">
			<Header
				compact
				sessionId={session.sessionId}
				projectPath={session.projectPath}
				subtitle="cost tracker"
			/>

			<Box marginTop={1} flexDirection="column">
				<Text color={colors.secondary} bold>
					╔══ Token Usage ══╗
				</Text>

				<Box marginTop={1} flexDirection="column">
					<Text>
						<Text color={colors.dim}>{"  Input:          "}</Text>
						<Text color={colors.primary} bold>
							{formatTokens(totals.inputTokens)}
						</Text>
					</Text>
					<Text>
						<Text color={colors.dim}>{"  Output:         "}</Text>
						<Text color={colors.accent} bold>
							{formatTokens(totals.outputTokens)}
						</Text>
					</Text>
					<Text>
						<Text color={colors.dim}>{"  Cache Create:   "}</Text>
						<Text color={colors.secondary}>{formatTokens(totals.cacheCreationTokens)}</Text>
					</Text>
					<Text>
						<Text color={colors.dim}>{"  Cache Read:     "}</Text>
						<Text color={colors.secondary}>{formatTokens(totals.cacheReadTokens)}</Text>
					</Text>
					<Text>
						<Text color={colors.dim}>{"  ─────────────────"}</Text>
					</Text>
					<Text>
						<Text color={colors.dim}>{"  Total:          "}</Text>
						<Text color={colors.bright} bold>
							{formatTokens(totalTokens)}
						</Text>
					</Text>
				</Box>

				<Box marginTop={1} flexDirection="column">
					<Text color={colors.secondary} bold>
						╔══ Cost ══╗
					</Text>
					<Box marginTop={1}>
						<Text>
							<Text color={colors.dim}>{"  Estimated:  "}</Text>
							<Text color={colors.warning} bold>
								{formatCost(totals.totalCostUSD)}
							</Text>
						</Text>
					</Box>
					<Text>
						<Text color={colors.dim}>{"  Messages:   "}</Text>
						<Text color={colors.text}>{totals.messageCount}</Text>
					</Text>
				</Box>
			</Box>

			<StatusBar lastUpdate={lastUpdate} />
		</Box>
	);
}
