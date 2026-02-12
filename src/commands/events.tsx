import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { JsonlTailer } from "../core/jsonl-parser.js";
import type { JsonlLine, SessionInfo, ToolUseContentBlock } from "../core/types.js";
import { Header } from "../ui/Header.js";
import { ScrollingLog } from "../ui/ScrollingLog.js";
import { SessionPicker } from "../ui/SessionPicker.js";
import { StatusBar } from "../ui/StatusBar.js";
import { colors, formatTimestamp } from "../ui/theme.js";
import { useSessionResolver } from "../ui/useSessionResolver.js";

interface EventsAppProps {
	session?: string;
}

interface EventEntry {
	timestamp: Date;
	type: string;
	detail: string;
	color: string;
}

export function EventsApp({ session }: EventsAppProps) {
	const { state: sessionState, pick } = useSessionResolver(session);

	if (sessionState.status === "loading") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="events" />
				<Text color={colors.warning}>░▒▓ Resolving session... ▓▒░</Text>
			</Box>
		);
	}

	if (sessionState.status === "error") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="events" />
				<Text color={colors.error}>Error: {sessionState.message}</Text>
			</Box>
		);
	}

	if (sessionState.status === "pick") {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="events" />
				<Box marginTop={1}>
					<SessionPicker sessions={sessionState.sessions} onSelect={pick} />
				</Box>
			</Box>
		);
	}

	return <EventsView session={sessionState.session} />;
}

function EventsView({ session }: { session: SessionInfo }) {
	const [events, setEvents] = useState<EventEntry[]>([]);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		let tailer: JsonlTailer | null = null;

		(async () => {
			tailer = new JsonlTailer(session.jsonlPath);

			tailer.on("line", (line: JsonlLine) => {
				const newEvents = extractEvents(line);
				if (newEvents.length > 0) {
					setEvents((prev) => [...prev, ...newEvents].slice(-200));
					setLastUpdate(new Date());
				}
			});

			await tailer.start();
		})();

		return () => {
			tailer?.stop();
		};
	}, [session.jsonlPath]);

	const logLines = events.map((e) => ({
		text: `${formatTimestamp(e.timestamp)} ${e.type.padEnd(12)} ${e.detail}`,
		color: e.color,
	}));

	return (
		<Box flexDirection="column">
			<Header
				compact
				sessionId={session.sessionId}
				projectPath={session.projectPath}
				subtitle="event log"
			/>

			<Box marginTop={1} flexDirection="column">
				<Text color={colors.secondary} bold>
					╔══ Tool / Event Log ══╗
				</Text>
				<ScrollingLog lines={logLines} maxVisible={20} />
			</Box>

			<StatusBar lastUpdate={lastUpdate} eventCount={events.length} />
		</Box>
	);
}

function extractEvents(line: JsonlLine): EventEntry[] {
	const now = new Date();
	const events: EventEntry[] = [];

	switch (line.type) {
		case "user": {
			const content = line.message?.content;
			if (Array.isArray(content)) {
				for (const block of content) {
					if (block.type === "tool_result") {
						events.push({
							timestamp: now,
							type: "tool_result",
							detail: `${block.tool_use_id.slice(0, 12)}${block.is_error ? " [ERROR]" : ""}`,
							color: block.is_error ? colors.error : colors.text,
						});
					}
				}
			} else if (typeof content === "string") {
				events.push({
					timestamp: now,
					type: "user_msg",
					detail: content.slice(0, 80),
					color: colors.secondary,
				});
			}
			break;
		}

		case "assistant": {
			const msg = line.message;
			if (msg?.content) {
				for (const block of msg.content) {
					if (block.type === "tool_use") {
						const toolBlock = block as ToolUseContentBlock;
						const inputPreview = summarizeToolInput(toolBlock.name, toolBlock.input);
						events.push({
							timestamp: now,
							type: "tool_use",
							detail: `${toolBlock.name} ${inputPreview}`,
							color: colors.accent,
						});
					} else if (block.type === "text") {
						events.push({
							timestamp: now,
							type: "text",
							detail: block.text.slice(0, 80),
							color: colors.primary,
						});
					}
				}
			}
			break;
		}

		case "system": {
			const content = line.message?.content ?? "";
			events.push({
				timestamp: now,
				type: "system",
				detail: content.slice(0, 80),
				color: colors.warning,
			});
			break;
		}
	}

	return events;
}

function summarizeToolInput(toolName: string, input: Record<string, unknown>): string {
	switch (toolName) {
		case "Read":
		case "Write":
		case "Edit":
			return (
				String(input.file_path ?? "")
					.split("/")
					.pop() ?? ""
			);
		case "Bash":
			return String(input.command ?? "").slice(0, 50);
		case "Glob":
			return String(input.pattern ?? "");
		case "Grep":
			return String(input.pattern ?? "");
		default:
			return "";
	}
}
