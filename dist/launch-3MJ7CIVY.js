import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  resolveSession
} from "./chunk-XSIEMPSQ.js";

// src/commands/launch.ts
import { execSync, spawn } from "child_process";
async function launch(opts) {
  const session = await resolveSession({ sessionId: opts.session });
  if (!session) {
    console.error("No session found. Use --session <id> or run from a project directory.");
    process.exit(1);
  }
  const sessionArg = session.sessionId;
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
function hasTmux() {
  try {
    execSync("which tmux", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function inTmux() {
  return !!process.env.TMUX;
}
function launchTmux(sessionId) {
  const flag = `-s ${sessionId}`;
  try {
    execSync(`tmux split-window -h "observe-claude reasoning ${flag}"`, { stdio: "inherit" });
    execSync(`tmux split-window -v "observe-claude cost ${flag}"`, { stdio: "inherit" });
    execSync("tmux select-pane -t 0", { stdio: "inherit" });
    execSync(`tmux split-window -v "observe-claude context ${flag} --banner"`, {
      stdio: "inherit"
    });
    execSync("tmux select-pane -t 0", { stdio: "inherit" });
    const child = spawn("observe-claude", ["events", "-s", sessionId], {
      stdio: "inherit"
    });
    child.on("exit", () => process.exit(0));
  } catch (err) {
    console.error("Failed to create tmux layout:", err);
    process.exit(1);
  }
}
function printManualInstructions(sessionId) {
  console.log(`
  observe-claude context -s ${sessionId}`);
  console.log(`  observe-claude cost -s ${sessionId}`);
  console.log(`  observe-claude events -s ${sessionId}`);
  console.log(`  observe-claude reasoning -s ${sessionId}`);
}
export {
  launch
};
//# sourceMappingURL=launch-3MJ7CIVY.js.map