import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// src/cli.ts
import { Command } from "commander";
import { render } from "ink";
import React from "react";
var program = new Command();
program.name("observe-claude").description("Read-only monitoring panes for live Claude Code sessions").version("0.1.0");
program.command("sessions").description("List Claude Code sessions").option("-a, --all", "Show sessions from all projects", false).option("-l, --limit <n>", "Max sessions to display", "20").action(async (opts) => {
  const { SessionsApp } = await import("./sessions-EEJNNPEI.js");
  const { render: render2 } = await import("ink");
  const instance = render2(
    React.createElement(SessionsApp, {
      all: opts.all,
      limit: Number.parseInt(opts.limit, 10)
    })
  );
  await instance.waitUntilExit();
});
program.command("context").description("Live context window gauge").option("-s, --session <id>", "Session ID (prefix match)").option("--banner", "Show large eye logo (used by launch)", false).action(async (opts) => {
  const { ContextApp } = await import("./context-LADHRTLA.js");
  const instance = render(
    React.createElement(ContextApp, { session: opts.session, banner: opts.banner })
  );
  await instance.waitUntilExit();
});
program.command("cost").description("Live token/cost tracker").option("-s, --session <id>", "Session ID (prefix match)").action(async (opts) => {
  const { CostApp } = await import("./cost-I4ZEV67L.js");
  const instance = render(React.createElement(CostApp, { session: opts.session }));
  await instance.waitUntilExit();
});
program.command("events").description("Live tool/event log").option("-s, --session <id>", "Session ID (prefix match)").action(async (opts) => {
  const { EventsApp } = await import("./events-4NQ7L7JK.js");
  const instance = render(React.createElement(EventsApp, { session: opts.session }));
  await instance.waitUntilExit();
});
program.command("reasoning").description("Live thinking blocks (experimental)").option("-s, --session <id>", "Session ID (prefix match)").action(async (opts) => {
  const { ReasoningApp } = await import("./reasoning-WY3HCRZX.js");
  const instance = render(React.createElement(ReasoningApp, { session: opts.session }));
  await instance.waitUntilExit();
});
program.command("launch").description("Spawn multi-pane monitoring layout").option("-s, --session <id>", "Session ID (prefix match)").action(async (opts) => {
  const { launch } = await import("./launch-3MJ7CIVY.js");
  await launch(opts);
});
program.command("init").description("Install observe-claude hooks into Claude Code").action(async () => {
  const { init } = await import("./init-HRDIGJNT.js");
  await init();
});
program.command("teardown").description("Remove observe-claude hooks from Claude Code").action(async () => {
  const { teardown } = await import("./teardown-XZKCTXXG.js");
  await teardown();
});
program.command("trace").description("Commit -> session lookup (requires Entire CLI)").argument("[commit]", "Commit hash").action(async (commit) => {
  const { trace } = await import("./trace-VQUB6D25.js");
  await trace(commit);
});
program.command("history").description("Commit list with sessions (requires Entire CLI)").action(async () => {
  const { history } = await import("./history-BKVV6JIP.js");
  await history();
});
program.parse();
//# sourceMappingURL=cli.js.map