import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  removeHooks
} from "./chunk-7HC7OBHP.js";

// src/commands/teardown.ts
async function teardown() {
  try {
    const result = await removeHooks();
    if (result.removed) {
      console.log("\u2713 observe-claude hooks removed from global settings.");
      console.log(`  Settings: ${result.settingsPath}`);
    } else {
      console.log("No observe-claude hooks found in global settings.");
      console.log(`  Checked: ${result.settingsPath}`);
    }
  } catch (err) {
    console.error("Failed to remove hooks:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
export {
  teardown
};
//# sourceMappingURL=teardown-XZKCTXXG.js.map