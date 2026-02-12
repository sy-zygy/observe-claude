import { Command } from "commander";
import { render } from "ink";
import React from "react";

const program = new Command();

program
	.name("observe-claude")
	.description("Read-only monitoring panes for live Claude Code sessions")
	.version("0.1.0");

// --- sessions ---
program
	.command("sessions")
	.description("List Claude Code sessions")
	.option("-a, --all", "Show sessions from all projects", false)
	.option("-l, --limit <n>", "Max sessions to display", "20")
	.action(async (opts) => {
		const { SessionsApp } = await import("./commands/sessions.js");
		const { render } = await import("ink");
		const instance = render(
			React.createElement(SessionsApp, {
				all: opts.all,
				limit: Number.parseInt(opts.limit, 10),
			}),
		);
		await instance.waitUntilExit();
	});

// --- context ---
program
	.command("context")
	.description("Live context window gauge")
	.option("-s, --session <id>", "Session ID (prefix match)")
	.option("--banner", "Show large eye logo (used by launch)", false)
	.action(async (opts) => {
		const { ContextApp } = await import("./commands/context.js");
		const instance = render(
			React.createElement(ContextApp, { session: opts.session, banner: opts.banner }),
		);
		await instance.waitUntilExit();
	});

// --- cost ---
program
	.command("cost")
	.description("Live token/cost tracker")
	.option("-s, --session <id>", "Session ID (prefix match)")
	.action(async (opts) => {
		const { CostApp } = await import("./commands/cost.js");
		const instance = render(React.createElement(CostApp, { session: opts.session }));
		await instance.waitUntilExit();
	});

// --- events ---
program
	.command("events")
	.description("Live tool/event log")
	.option("-s, --session <id>", "Session ID (prefix match)")
	.action(async (opts) => {
		const { EventsApp } = await import("./commands/events.js");
		const instance = render(React.createElement(EventsApp, { session: opts.session }));
		await instance.waitUntilExit();
	});

// --- reasoning ---
program
	.command("reasoning")
	.description("Live thinking blocks (experimental)")
	.option("-s, --session <id>", "Session ID (prefix match)")
	.action(async (opts) => {
		const { ReasoningApp } = await import("./commands/reasoning.js");
		const instance = render(React.createElement(ReasoningApp, { session: opts.session }));
		await instance.waitUntilExit();
	});

// --- launch ---
program
	.command("launch")
	.description("Spawn multi-pane monitoring layout")
	.option("-s, --session <id>", "Session ID (prefix match)")
	.action(async (opts) => {
		const { launch } = await import("./commands/launch.js");
		await launch(opts);
	});

// --- init ---
program
	.command("init")
	.description("Install observe-claude hooks into Claude Code")
	.action(async () => {
		const { init } = await import("./commands/init.js");
		await init();
	});

// --- teardown ---
program
	.command("teardown")
	.description("Remove observe-claude hooks from Claude Code")
	.action(async () => {
		const { teardown } = await import("./commands/teardown.js");
		await teardown();
	});

// --- trace (stub) ---
program
	.command("trace")
	.description("Commit -> session lookup (requires Entire CLI)")
	.argument("[commit]", "Commit hash")
	.action(async (commit) => {
		const { trace } = await import("./commands/trace.js");
		await trace(commit);
	});

// --- history (stub) ---
program
	.command("history")
	.description("Commit list with sessions (requires Entire CLI)")
	.action(async () => {
		const { history } = await import("./commands/history.js");
		await history();
	});

program.parse();
