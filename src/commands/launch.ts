import { execSync, spawn } from "node:child_process";
import { resolveSession } from "../core/session-resolver.js";

interface LaunchOptions {
	session?: string;
}

export async function launch(opts: LaunchOptions): Promise<void> {
	const session = await resolveSession({ sessionId: opts.session });

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
