import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// src/commands/trace.ts
async function trace(commit) {
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551   trace: Commit -> Session Lookup     \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.log("");
  console.log("This command requires the Entire CLI to be installed.");
  console.log("Run: observe-claude init --entire");
  console.log("");
  if (commit) {
    console.log(`Commit: ${commit}`);
  }
  console.log("Status: Not yet implemented");
  process.exit(0);
}
export {
  trace
};
//# sourceMappingURL=trace-VQUB6D25.js.map