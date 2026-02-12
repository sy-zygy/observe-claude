import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { JsonlTailer } from "../core/jsonl-parser.js";
import type { JsonlLine, SessionInfo, ThinkingContentBlock } from "../core/types.js";
import { Header } from "../ui/Header.js";
import { ScrollingLog } from "../ui/ScrollingLog.js";
import { SessionPicker } from "../ui/SessionPicker.js";
import { StatusBar } from "../ui/StatusBar.js";
import { colors } from "../ui/theme.js";
import { useSessionResolver } from "../ui/useSessionResolver.js";

interface ReasoningAppProps {
	session?: string;
}

interface ThinkingEntry {
	messageId: string;
	text: string;
	truncated: boolean;
}

export function ReasoningApp({ session }: ReasoningAppProps) {
	const { state: sessionState, pick } = useSessionResolver(session);

	if (sessionState.status === "loading") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="reasoning" />
				<Text color={colors.warning}>░▒▓ Resolving session... ▓▒░</Text>
			</Box>
		);
	}

	if (sessionState.status === "error") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="reasoning" />
				<Text color={colors.error}>Error: {sessionState.message}</Text>
			</Box>
		);
	}

	if (sessionState.status === "pick") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="reasoning" />
				<Box marginTop={1}>
					<SessionPicker sessions={sessionState.sessions} onSelect={pick} />
				</Box>
			</Box>
		);
	}

	return <ReasoningView session={sessionState.session} />;
}

function ReasoningView({ session }: { session: SessionInfo }) {
	const [thinkingBlocks, setThinkingBlocks] = useState<ThinkingEntry[]>([]);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		let tailer: JsonlTailer | null = null;

		(async () => {
			tailer = new JsonlTailer(session.jsonlPath);

			tailer.on("line", (line: JsonlLine) => {
				if (line.type !== "assistant") return;
				const msg = line.message;
				if (!msg?.content) return;

				for (const block of msg.content) {
					if (block.type === "thinking") {
						const thinking = block as ThinkingContentBlock;
						setThinkingBlocks((prev) =>
							[
								...prev,
								{
									messageId: msg.id,
									text: thinking.thinking,
									truncated: thinking.thinking.length > 500,
								},
							].slice(-50),
						);
						setLastUpdate(new Date());
					}
				}
			});

			await tailer.start();
		})();

		return () => {
			tailer?.stop();
		};
	}, [session.jsonlPath]);

	const logLines = thinkingBlocks.map((entry) => {
		const preview = entry.text.slice(0, 200).replace(/\n/g, " ");
		return {
			text: `[${entry.messageId.slice(0, 8)}] ${preview}${entry.truncated ? "…" : ""}`,
			color: colors.primary,
		};
	});

	return (
		<Box flexDirection="column">
			<Header
				compact
				sessionId={session.sessionId}
				projectPath={session.projectPath}
				subtitle="reasoning (experimental)"
			/>

			<Box marginTop={1} flexDirection="column">
				<Text color={colors.secondary} bold>
					╔══ Thinking Blocks ══╗
				</Text>
				{thinkingBlocks.length === 0 ? (
					<Text color={colors.dim}>
						Waiting for thinking blocks... (extended thinking must be enabled)
					</Text>
				) : (
					<ScrollingLog lines={logLines} maxVisible={15} />
				)}
			</Box>

			<StatusBar lastUpdate={lastUpdate} />
		</Box>
	);
}
