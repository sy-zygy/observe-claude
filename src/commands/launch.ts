import { execSync, spawn } from "node:child_process";
import { render, useApp } from "ink";
import React from "react";
import { listSessionsForProject, resolveSession } from "../core/session-resolver.js";
import type { SessionInfo } from "../core/types.js";
import { SessionPicker } from "../ui/SessionPicker.js";

interface LaunchOptions {
	session?: string;
}

/**
 * Wrapper component that renders SessionPicker and exits the Ink app on selection.
 */
function PickerWrapper({
	sessions,
	onSelect,
}: {
	sessions: SessionInfo[];
	onSelect: (session: SessionInfo) => void;
}) {
	const { exit } = useApp();

	const handleSelect = (session: SessionInfo) => {
		onSelect(session);
		exit();
	};

	return React.createElement(SessionPicker, { sessions, onSelect: handleSelect });
}

async function pickSessionInteractively(sessions: SessionInfo[]): Promise<SessionInfo> {
	let selected: SessionInfo | null = null;

	const instance = render(
		React.createElement(PickerWrapper, {
			sessions,
			onSelect: (session: SessionInfo) => {
				selected = session;
			},
		}),
	);

	await instance.waitUntilExit();
	if (!selected) {
		throw new Error("No session selected");
	}
	return selected;
}

export async function launch(opts: LaunchOptions): Promise<void> {
	let session: SessionInfo | null = null;

	if (opts.session) {
		// Explicit session ID — resolve directly
		session = await resolveSession({ sessionId: opts.session });
	} else {
		const sessions = await listSessionsForProject(process.cwd());

		if (sessions.length === 0) {
			// Fallback to resolveSession (existing behavior)
			session = await resolveSession();
		} else if (sessions.length === 1) {
			session = sessions[0];
		} else {
			// Multiple sessions — show interactive picker
			session = await pickSessionInteractively(sessions.slice(0, 8));
		}
	}

	if (!session) {
		console.error("No session found. Use --session <id> or run from a project directory.");
		process.exit(1);
	}

	const sessionArg = session.sessionId;

	// Check for tmux
	if (hasTmux() && inTmux()) {
		console.log("Launching observe-claude panes in tmux...");
		launchTmux(sessionArg);
		return;
	}

	if (hasTmux()) {
		console.log("tmux is available but you're not in a tmux session.");
		console.log("Start tmux first, then run: observe-claude launch");
		console.log("\nOr run individual panes:");
		printManualInstructions(sessionArg);
		return;
	}

	console.log("tmux not found. Run individual panes in separate terminals:");
	printManualInstructions(sessionArg);
}

function hasTmux(): boolean {
	try {
		execSync("which tmux", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function inTmux(): boolean {
	return !!process.env.TMUX;
}

function launchTmux(sessionId: string): void {
	const flag = `-s ${sessionId}`;

	// Split into 4 panes:
	// ┌──────────┬──────────┐
	// │ events   │reasoning │
	// ├──────────┼──────────┤
	// │ context  │  cost    │
	// └──────────┴──────────┘

	try {
		// Current pane (0) will become events. Split right for reasoning.
		execSync(`tmux split-window -h "observe-claude reasoning ${flag}"`, { stdio: "inherit" });
		// Split reasoning pane (1) vertically down for cost
		execSync(`tmux split-window -v "observe-claude cost ${flag}"`, { stdio: "inherit" });
		// Go back to events pane (0) and split down for context
		execSync("tmux select-pane -t 0", { stdio: "inherit" });
		execSync(`tmux split-window -v "observe-claude context ${flag} --banner"`, {
			stdio: "inherit",
		});

		// Current pane (0) is events — run it here
		execSync("tmux select-pane -t 0", { stdio: "inherit" });
		const child = spawn("observe-claude", ["events", "-s", sessionId], {
			stdio: "inherit",
		});
		child.on("exit", () => process.exit(0));
	} catch (err) {
		console.error("Failed to create tmux layout:", err);
		process.exit(1);
	}
}

function printManualInstructions(sessionId: string): void {
	console.log(`\n  observe-claude context -s ${sessionId}`);
	console.log(`  observe-claude cost -s ${sessionId}`);
	console.log(`  observe-claude events -s ${sessionId}`);
	console.log(`  observe-claude reasoning -s ${sessionId}`);
}
