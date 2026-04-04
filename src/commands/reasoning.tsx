import process from "node:process";
import { Box, Text, useInput } from "ink";
import { useEffect, useRef, useState } from "react";
import { JsonlTailer } from "../core/jsonl-parser.js";
import type { ContentBlock, JsonlLine, SessionInfo, ToolUseContentBlock } from "../core/types.js";
import { Header } from "../ui/Header.js";
import { ScrollingLog } from "../ui/ScrollingLog.js";
import { SessionPicker } from "../ui/SessionPicker.js";
import { StatusBar } from "../ui/StatusBar.js";
import { colors } from "../ui/theme.js";
import { useSessionResolver } from "../ui/useSessionResolver.js";

interface ReasoningAppProps {
	session?: string;
}

interface ReasoningEntry {
	messageId: string;
	kind: "thinking" | "text" | "tool";
	text: string;
	color: string;
}

export function ReasoningApp({ session }: ReasoningAppProps) {
	const { state: sessionState, pick, repick } = useSessionResolver(session);

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

	return <ReasoningView session={sessionState.session} onRepick={repick} />;
}

/** Summarize a tool_use block into a short readable string */
function formatToolUse(block: ToolUseContentBlock): string {
	const input = block.input ?? {};
	switch (block.name) {
		case "Read":
		case "Write":
		case "Glob":
			return `${block.name} ${input.file_path ?? input.path ?? input.pattern ?? ""}`;
		case "Edit":
			return `Edit ${input.file_path ?? ""}`;
		case "Bash":
			return `Bash ${String(input.command ?? "").slice(0, 80)}`;
		case "Grep":
			return `Grep ${input.pattern ?? ""} ${input.glob ?? input.path ?? ""}`;
		case "Agent":
			return `Agent ${input.description ?? input.subagent_type ?? ""}`;
		default:
			return block.name;
	}
}

/** Convert a content block into a reasoning entry */
function blockToEntry(messageId: string, block: ContentBlock): ReasoningEntry | null {
	switch (block.type) {
		case "thinking":
			return { messageId, kind: "thinking", text: "thinking...", color: colors.dim };
		case "text": {
			const text = (block as { text: string }).text;
			if (!text) return null;
			const preview = text.slice(0, 200).replace(/\n/g, " ");
			return {
				messageId,
				kind: "text",
				text: preview + (text.length > 200 ? "..." : ""),
				color: colors.primary,
			};
		}
		case "tool_use":
			return {
				messageId,
				kind: "tool",
				text: formatToolUse(block as ToolUseContentBlock),
				color: colors.accent,
			};
		default:
			return null;
	}
}

function ReasoningView({ session, onRepick }: { session: SessionInfo; onRepick: () => void }) {
	useInput((input) => {
		if (input === "q") process.exit(0);
		if (input === "s") onRepick();
	});
	const [entries, setEntries] = useState<ReasoningEntry[]>([]);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
	const seenRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		let tailer: JsonlTailer | null = null;

		(async () => {
			tailer = new JsonlTailer(session.jsonlPath);

			tailer.on("line", (line: JsonlLine) => {
				if (line.type !== "assistant") return;
				const msg = line.message;
				if (!msg?.content) return;

				const newEntries: ReasoningEntry[] = [];

				for (const block of msg.content) {
					// Deduplicate: streaming chunks share the same message.id
					const dedupeKey =
						block.type === "tool_use"
							? `${msg.id}:${(block as ToolUseContentBlock).id}`
							: `${msg.id}:${block.type}`;

					if (seenRef.current.has(dedupeKey)) continue;
					seenRef.current.add(dedupeKey);

					const entry = blockToEntry(msg.id, block);
					if (entry) newEntries.push(entry);
				}

				if (newEntries.length > 0) {
					setEntries((prev) => [...prev, ...newEntries].slice(-100));
					setLastUpdate(new Date());
				}
			});

			tailer.on("truncated", () => {
				setEntries([]);
				seenRef.current = new Set();
			});

			await tailer.start();
		})();

		return () => {
			tailer?.stop();
		};
	}, [session.jsonlPath]);

	const logLines = entries.map((entry) => {
		const prefix = entry.kind === "thinking" ? "  ▒ " : entry.kind === "tool" ? "  > " : "  ";
		return {
			text: `${prefix}${entry.text}`,
			color: entry.color,
		};
	});

	return (
		<Box flexDirection="column">
			<Header
				compact
				sessionId={session.sessionId}
				projectPath={session.projectPath}
				subtitle="reasoning"
			/>

			<Box marginTop={1} flexDirection="column">
				<Text color={colors.secondary} bold>
					╔══ Reasoning Trace ══╗
				</Text>
				{entries.length === 0 ? (
					<Text color={colors.dim}>Waiting for assistant messages...</Text>
				) : (
					<ScrollingLog lines={logLines} maxVisible={20} />
				)}
			</Box>

			<StatusBar lastUpdate={lastUpdate} />
		</Box>
	);
}
