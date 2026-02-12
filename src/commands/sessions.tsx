import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import {
	getSessionPreview,
	listAllSessions,
	listSessionsForProject,
} from "../core/session-resolver.js";
import type { SessionInfo } from "../core/types.js";
import { Header } from "../ui/Header.js";
import { Table } from "../ui/Table.js";
import { colors, formatRelativeTime } from "../ui/theme.js";

interface SessionsAppProps {
	all?: boolean;
	limit?: number;
}

interface SessionRow {
	id: string;
	project: string;
	modified: string;
	name: string;
	preview: string;
}

export function SessionsApp({ all = false, limit = 20 }: SessionsAppProps) {
	const [sessions, setSessions] = useState<SessionRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const raw: SessionInfo[] = all
					? await listAllSessions()
					: await listSessionsForProject(process.cwd());

				const rows: SessionRow[] = [];
				for (const s of raw.slice(0, limit)) {
					const preview = await getSessionPreview(s.jsonlPath);
					rows.push({
						id: s.sessionId.slice(0, 8),
						project: s.projectPath
							? s.projectPath.split("/").slice(-2).join("/")
							: s.encodedPath.slice(0, 20),
						modified: s.modified ? formatRelativeTime(s.modified) : "unknown",
						name: s.name ?? "",
						preview: preview ?? "",
					});
				}

				setSessions(rows);
			} catch (err) {
				setError(err instanceof Error ? err.message : String(err));
			} finally {
				setLoading(false);
			}
		})();
	}, [all, limit]);

	if (loading) {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="sessions" />
				<Text color={colors.warning}>░▒▓ Loading sessions... ▓▒░</Text>
			</Box>
		);
	}

	if (error) {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="sessions" />
				<Text color={colors.error}>Error: {error}</Text>
			</Box>
		);
	}

	if (sessions.length === 0) {
		return (
			<Box flexDirection="column">
				<Header compact subtitle="sessions" />
				<Text color={colors.warning}>
					No sessions found. {all ? "" : "Try --all to search all projects."}
				</Text>
			</Box>
		);
	}

	const columns = [
		{ key: "id", label: "ID", width: 10 },
		{ key: "project", label: "Project", width: 24 },
		{ key: "modified", label: "Modified", width: 12 },
		{ key: "name", label: "Name", width: 20 },
		{ key: "preview", label: "First Message", width: 40 },
	];

	return (
		<Box flexDirection="column">
			<Header compact subtitle="sessions" />
			<Box marginTop={1}>
				<Text color={colors.dim}>
					{all ? "All sessions" : `Sessions for ${process.cwd()}`} ({sessions.length}
					{sessions.length === limit ? "+" : ""})
				</Text>
			</Box>
			<Box marginTop={1}>
				<Table columns={columns} data={sessions} maxRows={limit} />
			</Box>
		</Box>
	);
}
