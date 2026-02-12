import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  installHooks
} from "./chunk-7HC7OBHP.js";

// src/commands/init.ts
async function init() {
  try {
    const result = await installHooks();
    if (result.installed) {
      console.log("\u2713 observe-claude hooks installed globally.");
      console.log("");
      console.log(`  Settings:  ${result.settingsPath}`);
      console.log(`  Script:    ${result.hookScript}`);
      console.log("  Events:    ~/.observe-claude/events/");
      console.log("");
      console.log("  Hooks: PreToolUse, PostToolUse, Stop, PreCompact, SessionStart");
      console.log("  These hooks apply to ALL Claude Code sessions across all projects.");
      console.log("  Run `observe-claude teardown` to remove them.");
    } else {
      console.log("observe-claude hooks are already installed globally.");
      console.log(`  Settings: ${result.settingsPath}`);
    }
  } catch (err) {
    console.error("Failed to install hooks:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
export {
  init
};
//# sourceMappingURL=init-HRDIGJNT.js.map