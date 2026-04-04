# AGENTS.md — observe-claude

Read-only CLI monitoring panes for live Claude Code sessions. Node.js 18+, ESM-only, Ink v5 (React for CLI), Commander, chokidar. All data comes from local JSONL files — no network calls, no writes to Claude Code sessions. See `docs/PRD.md` for full architecture and JSONL schema.

## Build, Test, Lint

```bash
npm run build          # tsup ESM bundle → dist/
npm run dev            # tsup --watch
npm test               # vitest run (src/__tests__/**/*.test.ts)
npm run test:watch     # vitest
npm run lint           # biome check .
npm run lint:fix       # biome check --write .
npm install -g .       # install CLI globally for manual testing
```

Tests are in `src/__tests__/`. Fixtures are in `src/__fixtures__/` (JSONL samples, session index). Always run `npm run lint:fix` before committing.

## Code Style

Enforced by Biome (`biome.json`):
- **Tabs** for indentation (not spaces)
- **No semicolons**
- **100-character** line width
- Organize imports enabled

Conventions:
- ESM imports use `.js` extension (even for `.ts` files): `import { foo } from "./bar.js"`
- `camelCase` for variables/functions, `PascalCase` for React components and types
- Core modules export **factory functions** (`createUsageAggregator()`, `createContextEstimator()`) returning interface objects — not classes
- React/Ink components are function components with hooks. No class components
- Colors and box-drawing characters come from `src/ui/theme.ts` — never hardcode color strings

## Architecture

Three layers:

```
src/
  core/       # Pure logic: JSONL parsing, token aggregation, context estimation, session resolution
  commands/   # Ink React apps: one file per CLI command (context, cost, events, reasoning, sessions)
  ui/         # Shared React components (Header, StatusBar, SessionPicker) and theme
  cli.ts      # Commander entry point — registers all commands
```

**Data flow for live commands** (context, cost, events, reasoning):
1. `useSessionResolver` hook resolves session → `SessionInfo` with `jsonlPath`
2. Component creates a `JsonlTailer` watching that path
3. Tailer emits `"line"` events → fed into a processor (`createUsageAggregator`, `createContextEstimator`, etc.)
4. Processor state is lifted into React state via `useState` setter
5. Tailer emits `"truncated"` on file truncation (compaction) → processor resets

**Key filesystem paths:**
- Session JSONL: `~/.claude/projects/<encoded-path>/<session-uuid>.jsonl`
- Session index: `~/.claude/projects/<encoded-path>/sessions-index.json`
- Hook events: `~/.observe-claude/events/<session-id>.jsonl`
- Path encoding: `/Users/foo/bar` → `-Users-foo-bar`

### Adding a new command

1. Create `src/commands/mycommand.tsx` — export a React component (see `context.tsx` as canonical example)
2. Handle session resolution states: loading, error, pick, resolved
3. Use `JsonlTailer` + a processor in a `useEffect` with cleanup
4. Add keyboard shortcuts via `useInput` from Ink: `q` → `process.exit(0)`, `s` → `repick()` (return to session picker)
5. Register in `src/cli.ts` with Commander
6. Add to the `launch` tmux layout if applicable

## JSONL Streaming Gotchas

This is the most important domain knowledge for this codebase:

**Message consolidation.** Assistant messages stream as multiple JSONL lines sharing the same `message.id`. Each line carries one content block. You must group by `message.id` and merge content blocks. See `consolidateAssistantMessages()` in `src/core/jsonl-parser.ts`.

**Usage from last chunk only.** Each streaming chunk carries `usage` fields, but only the **last** chunk for a given `message.id` has final values. Earlier chunks have partial/intermediate counts. The `createUsageAggregator` uses a subtract-then-add pattern: when a new chunk arrives for the same ID, subtract the previous values then add the new ones.

**Context is replacement, not accumulation.** The context estimator (`src/core/context-estimator.ts`) **replaces** `currentTokens` with the latest assistant message's total prompt tokens — it does NOT add them up across messages. Each assistant message reports cumulative context, not incremental.

**Compaction resets everything.** A `system` message with `compact_boundary: true` means Claude Code compacted context. Reset all accumulators to zero.

**Defensive parsing.** Any JSONL line can be malformed or have an unknown schema. `parseLine()` returns `null` for anything unparseable. Always handle `null`. Never `JSON.parse()` session data without a try/catch.

**Content block types:** `text`, `tool_use`, `tool_result`, `thinking`. Code should handle unknown types gracefully (skip, don't crash).

## Do / Don't

**Do:**
- Use factory functions for stateful core modules (not classes)
- Use `colors` and `borders` from `src/ui/theme.ts` for all styling
- Handle all session resolver states (loading / error / pick / resolved)
- Reset processor state on `"truncated"` events from `JsonlTailer`
- Use `.js` extensions in all ESM imports
- Return `null` from parsers for unrecognized data (fail silently, log nothing)
- Test core logic with inline JSON objects; test integration with `src/__fixtures__/sample-session.jsonl`

**Don't:**
- Accumulate context tokens across messages (replace, not sum)
- Use `usage` from any chunk except the last per `message.id`
- Forget to clean up `JsonlTailer` in `useEffect` return
- Hardcode color strings — always go through `theme.ts`
- Add network calls — this tool is 100% local filesystem reads
- Use `require()` or CommonJS — this is ESM-only
- Modify anything under `~/.claude/` (read-only tool)

## Testing

Vitest with `globals: true` — no need to import `describe`/`it`/`expect`.

```ts
const FIXTURES = join(import.meta.dirname, "..", "__fixtures__")
const lines = await readJsonlLines(join(FIXTURES, "sample-session.jsonl"))
```

Tests cover core modules: `jsonl-parser`, `context-estimator`, `usage-aggregator`, `session-resolver`. When adding core logic, add a test file at `src/__tests__/<module>.test.ts`. Command components (Ink/React) are tested manually via `npm install -g . && observe-claude <command>`.
