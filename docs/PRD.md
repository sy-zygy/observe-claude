# observe-claude — Product Requirements Document

**Version:** 0.1.0
**Author:** Gabriel / Rhomega Research Corp
**Date:** February 11, 2026
**Status:** Implemented

---

## 1. Overview

`observe-claude` is a CLI tool that attaches read-only monitoring panes to a live Claude Code session. The primary Claude Code TUI runs in one terminal pane as normal. Additional panes display real-time context window usage, tool/event activity, reasoning output, and token cost tracking — without interfering with the main session.

The tool ships as a globally-installed npm package (`npm install -g .`). Once installed, it works from any project folder with zero per-project configuration. An optional `init` command installs Claude Code hooks globally for richer event data.

---

## 2. Problem Statement

Claude Code's interactive TUI gives you a great coding experience but limited observability. Key information is either buried (reasoning/thinking), only available on-demand (`/context`), or not surfaced at all (cumulative cost). Power users running long sessions or multi-agent workflows need persistent, at-a-glance monitoring without disrupting their primary workflow.

---

## 3. User Persona

Developers who use Claude Code daily and want:

- Awareness of context window consumption before hitting auto-compact
- Visibility into what tools Claude is calling and when
- Access to Claude's reasoning/thinking output in a dedicated view
- Running cost tracking across a session

---

## 4. Design Principles

1. **Non-invasive** — The main Claude Code TUI is untouched. Observers are read-only.
2. **Works immediately** — `npm install -g .` → `observe-claude context` from any project.
3. **Passive by default** — All panes read JSONL session files on disk. No hooks required for basic functionality.
4. **Hooks opt-in** — `observe-claude init` installs hooks globally into `~/.claude/settings.local.json` for richer event data. No per-project files are created.
5. **Session auto-detection** — Attaches to the most recent session for the current project directory, with `--session <id>` override and an interactive picker when multiple sessions exist.

---

## 5. Architecture

### 5.1 Data Sources

Sessions are stored as JSONL files at `~/.claude/projects/<encoded-path>/<session-uuid>.jsonl`. The path encoding replaces `/` with `-` (e.g., `/Users/foo/bar` → `-Users-foo-bar`). A `sessions-index.json` file in each project directory provides session metadata.

**There is no `context.json` or `metadata.json`.** All data is parsed from the single JSONL file per session.

| Data | Source | Method | Requires Hooks? |
|---|---|---|---|
| Context window usage | Session JSONL (assistant message `usage` fields) | Estimate from `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` | No |
| Tool calls & text | Session JSONL (`tool_use`, `tool_result`, `text` content blocks) | Tail file with chokidar | No |
| Reasoning/thinking | Session JSONL (`thinking` content blocks in assistant messages) | Filter from message stream | No |
| Token usage / cost | Session JSONL (`usage` fields) + built-in model pricing table | Parse from message stream, group by `message.id` | No |
| Rich event data | Claude Code hooks → `~/.observe-claude/events/<session-id>.jsonl` | Hook script appends JSON lines | **Yes** |

### 5.2 JSONL Schema

Each line in a session JSONL is a JSON object with a `type` field: `user`, `assistant`, `system`, `progress`, `summary`, or `file-history-snapshot`.

**Critical:** Assistant messages are streamed as multiple JSONL lines sharing the same `message.id`. Each line carries one content block. The last line for a given `message.id` has the final `usage` values. The parser groups by `message.id` and consolidates content blocks, taking usage from the last chunk.

Content block types: `text`, `tool_use`, `tool_result`, `thinking`.

Context resets on `system` messages with `compact_boundary: true`.

### 5.3 Component Diagram

```
┌────────────────────────────────────────────────────┐
│  Terminal Layout (tmux or manual split)              │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │  events             │  │  reasoning              │  │
│  │  [tool/event log]   │  │  [thinking blocks]      │  │
│  ├────────────────────┤  ├────────────────────────┤  │
│  │  context            │  │  cost                   │  │
│  │  [context gauge]    │  │  [token/cost tracker]   │  │
│  │  [eye logo]         │  │                         │  │
│  └────────────────────┘  └────────────────────────┘  │
└────────────────────────────────────────────────────┘

        ▲ All panes read from:
        │
   ~/.claude/projects/<encoded-path>/
   ├── <session-uuid>.jsonl   ← all panes parse this
   └── sessions-index.json    ← session listing/metadata

   ~/.observe-claude/events/<session-id>.jsonl  ← hook events (opt-in)
```

### 5.4 Hook Architecture (opt-in, global)

`observe-claude init` adds hooks to `~/.claude/settings.local.json` (the global user-level settings file, gitignored by Claude Code). Hooks apply to **all** Claude Code sessions across all projects.

| Hook Event | Purpose |
|---|---|
| `PreToolUse` | Log tool call intent |
| `PostToolUse` | Log tool result |
| `SessionStart` | Record session start |
| `PreCompact` | Flag context compaction |
| `Stop` | Record session end |

The hook script (`hooks/observe-claude-hook.mjs`) reads JSON from stdin and appends a structured line to `~/.observe-claude/events/<session-id>.jsonl`. It always exits 0 and never blocks Claude Code.

---

## 6. CLI Interface

### 6.1 Installation

```bash
git clone <repo>
cd observe-claude
npm install -g .
```

Dependencies (all bundled as npm packages): Commander, Ink v5, React 18, chokidar. No external binaries required for core functionality. Context estimation, cost calculation, and JSONL parsing are all built-in — no `cccontext` or `ccusage` dependencies.

### 6.2 Commands

#### `observe-claude sessions`

List available Claude Code sessions with metadata.

```
$ observe-claude sessions --all

╔══════════╦════════════════════════╦════════════╦══════════════════╗
║ID        ║Project                 ║Modified    ║First Message     ║
╠══════════╬════════════════════════╬════════════╬══════════════════╣
║3a32b02c  ║dev/my-project          ║0s ago      ║Help me refactor… ║
║85ee160c  ║dev/my-project          ║8m ago      ║Study the PRD…    ║
╚══════════╩════════════════════════╩════════════╩══════════════════╝
```

Options:
- `-a, --all` — Show sessions from all projects (default: current directory only)
- `-l, --limit <n>` — Max sessions to display (default: 20)

---

#### `observe-claude context [--session <id>]`

Live context window usage monitor. Estimates context usage from the last assistant message's token fields (input + cache_creation + cache_read). Resets on compaction boundaries.

```
$ observe-claude context

▓█▓ OBSERVE-CLAUDE ▓█▓
session: 3a32b02c │ /Users/dev/my-project
context window

╔══ Context Window Usage ══╗
[████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 42.3%
Tokens: 84.6K / 200.0K
⚡ Compactions: 1
```

Options:
- `-s, --session <id>` — Attach to specific session by ID prefix (default: auto-detect)
- `--banner` — Show large eye logo (used internally by `launch`)

---

#### `observe-claude events [--session <id>]`

Live tool call and event log. Parses `tool_use` and `tool_result` content blocks from the session JSONL. Richer data available when hooks are installed (`observe-claude init`).

```
$ observe-claude events

  20:15:01  tool_use     Read src/main.ts
  20:15:01  tool_result  tu_001
  20:15:03  tool_use     Edit main.ts
  20:15:05  text         I've updated the file...
  20:15:10  system       Context compacted.
```

Options:
- `-s, --session <id>` — Attach to specific session by ID prefix

---

#### `observe-claude reasoning [--session <id>]`

Live display of Claude's thinking/reasoning blocks. Experimental.

Extracts `thinking` content blocks from assistant messages. Shows a scrolling log of reasoning previews.

Options:
- `-s, --session <id>` — Attach to specific session by ID prefix

---

#### `observe-claude cost [--session <id>]`

Live token usage and estimated cost tracker. Groups by `message.id` to avoid double-counting streaming chunks. Uses built-in model pricing for Opus, Sonnet, and Haiku families.

```
$ observe-claude cost

╔══ Token Usage ══╗
  Input:          84.6K
  Output:         12.3K
  Cache Create:   45.2K
  Cache Read:     28.1K
  ─────────────────
  Total:          170.2K

╔══ Cost ══╗
  Estimated:  $1.24
  Messages:   12
```

Options:
- `-s, --session <id>` — Attach to specific session by ID prefix

---

#### `observe-claude launch [--session <id>]`

Opens a 4-pane tmux layout with all observers.

```
┌──────────┬──────────┐
│ events   │reasoning │
├──────────┼──────────┤
│ context  │  cost    │
│ (+ eye)  │          │
└──────────┴──────────┘
```

If not in a tmux session, prints the commands to run manually.

Options:
- `-s, --session <id>` — Attach all panes to specific session

---

#### `observe-claude init`

Install hooks globally into `~/.claude/settings.local.json`. No per-project files are created. Hooks apply to all Claude Code sessions.

```
$ observe-claude init

✓ observe-claude hooks installed globally.

  Settings:  ~/.claude/settings.local.json
  Script:    /path/to/observe-claude/hooks/observe-claude-hook.mjs
  Events:    ~/.observe-claude/events/

  Hooks: PreToolUse, PostToolUse, Stop, PreCompact, SessionStart
  These hooks apply to ALL Claude Code sessions across all projects.
  Run `observe-claude teardown` to remove them.
```

#### `observe-claude teardown`

Remove all observe-claude hooks from `~/.claude/settings.local.json`.

---

#### `observe-claude trace <commit>` (stub)

Commit → session lookup. Requires Entire CLI (not yet implemented).

#### `observe-claude history` (stub)

Commit list with sessions. Requires Entire CLI (not yet implemented).

---

## 7. Session Resolution Logic

When `--session` is not provided, the tool resolves the target session as follows:

1. Encode the current working directory as a project path (`/Users/foo/bar` → `-Users-foo-bar`)
2. Look for `~/.claude/projects/<encoded-path>/sessions-index.json`
3. If the index exists, list sessions sorted by `modified` date
4. If the index doesn't exist, scan for `*.jsonl` files in the project directory and use file stat times
5. **If multiple sessions exist**, show an interactive picker (arrow keys + Enter)
6. **If one session exists**, use it directly
7. **If none found**, fall back to searching all projects

When `--session` is provided with a partial ID (e.g., `3a32`), prefix-match across all projects.

---

## 8. Technical Decisions

### 8.1 Technology

- **Runtime:** Node.js >= 18, ESM-only
- **Terminal UI:** [Ink](https://github.com/vadimdemedes/ink) v5 (React for CLI) with retro warez/BBS aesthetic
- **File watching:** chokidar v4 for real-time JSONL tailing
- **JSONL parsing:** Custom stream parser with streaming chunk consolidation by `message.id`
- **Context estimation:** Built-in — uses `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` from the last assistant message. No external dependency.
- **Cost calculation:** Built-in model pricing table for Opus, Sonnet, Haiku families. No `ccusage` dependency.
- **CLI framework:** Commander
- **Build:** tsup (ESM bundle), Biome (lint/format), Vitest (tests)

### 8.2 Aesthetic

Retro warez/BBS/demoscene theme:
- Matrix green (`#00FF41`), electric cyan (`#00BFFF`), orange (`#FF6600`), gold (`#FFD700`), hot red (`#FF0040`)
- Double-line box-drawing characters (`╔═╗║╚╝`)
- Block character progress bars (`█▓▒░`)
- ASCII eye logo

### 8.3 Performance

- File watching via chokidar (event-driven, not polling)
- No network calls — everything is local file reads
- Graceful handling of missing/malformed lines (skip and continue)

### 8.4 Compatibility

- **Claude Code versions:** Defensive parsing — unknown fields ignored, missing fields show "unknown"
- **OS:** macOS and Linux. Windows WSL as best-effort.
- **Node.js:** >= 18

---

## 9. Risks and Remaining Questions

### 9.1 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Claude Code changes JSONL schema | High | Defensive parsing, fail gracefully per-line |
| Thinking blocks redacted or format changes | Medium | Reasoning pane marked experimental, graceful "no data" state |
| Hooks slow down Claude Code | Low | Hook script always exits 0, async append only |
| Context estimation accuracy | Medium | Using total prompt tokens as proxy — no per-category breakdown available from JSONL |

### 9.2 Open Questions

1. **Multi-agent / subagent sessions** — How do subagent sessions spawned by `Task` tool appear in the file system? May need special handling.
2. **Entire CLI integration** — `trace` and `history` commands are stubbed. Full implementation deferred.
3. **Per-category context breakdown** — The JSONL only provides aggregate token counts, not per-category (system prompt, messages, tool results). A finer breakdown would require heuristics or changes to Claude Code's output.

---

## 10. Implementation Status

All milestones are implemented:

- **Sessions:** `observe-claude sessions` lists real sessions from `~/.claude/projects/`
- **Context:** Live context gauge with progress bar, compaction tracking
- **Cost:** Live token counts and dollar cost with per-model pricing
- **Events:** Live tool/event log parsed from JSONL + optional hook events
- **Reasoning:** Live thinking block display (experimental)
- **Launch:** tmux 4-pane layout with eye logo
- **Hooks:** Global install/teardown via `~/.claude/settings.local.json`
- **Session picker:** Interactive picker when multiple sessions exist
- **Tests:** 20 unit tests across parser, resolver, estimator, aggregator
- **Stubs:** `trace` and `history` commands present with "requires Entire CLI" messaging

---

## 11. Non-Goals (for v1)

- Modifying or injecting into the Claude Code session (write operations)
- Web-based dashboard (terminal only)
- Remote session monitoring (local only)
- Recording/replay of sessions
- Integration with CI/CD or headless mode (separate concern)
