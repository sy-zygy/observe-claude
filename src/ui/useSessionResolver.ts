import { useEffect, useState } from "react";
import { listSessionsForProject } from "../core/session-resolver.js";
import { resolveSession } from "../core/session-resolver.js";
import type { SessionInfo } from "../core/types.js";

export type SessionState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "pick"; sessions: SessionInfo[] }
	| { status: "resolved"; session: SessionInfo };

/**
 * Hook that resolves a session, showing a picker when multiple are found.
 * Pass `sessionId` to skip the picker (explicit --session flag).
 */
export function useSessionResolver(sessionId?: string): {
	state: SessionState;
	pick: (session: SessionInfo) => void;
} {
	const [state, setState] = useState<SessionState>({ status: "loading" });

	useEffect(() => {
		(async () => {
			try {
				if (sessionId) {
					// Explicit session ID — resolve directly
					const session = await resolveSession({ sessionId });
					if (!session) {
						setState({
							status: "error",
							message: `No session found matching "${sessionId}".`,
						});
						return;
					}
					setState({ status: "resolved", session });
					return;
				}

				// No explicit ID — check how many sessions exist for this project
				const sessions = await listSessionsForProject(process.cwd());

				if (sessions.length === 0) {
					// Fallback to global resolve
					const session = await resolveSession();
					if (!session) {
						setState({
							status: "error",
							message: "No session found. Use --session <id> or run from a project directory.",
						});
						return;
					}
					setState({ status: "resolved", session });
					return;
				}

				if (sessions.length === 1) {
					setState({ status: "resolved", session: sessions[0] });
					return;
				}

				// Multiple sessions — show picker
				setState({ status: "pick", sessions });
			} catch (err) {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : String(err),
				});
			}
		})();
	}, [sessionId]);

	function pick(session: SessionInfo) {
		setState({ status: "resolved", session });
	}

	return { state, pick };
}
