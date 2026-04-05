# observe-claude

Read-only monitoring panes for live Claude Code sessions. Tails the JSONL session files that Claude Code writes to `~/.claude/projects/` and displays context usage, token costs, tool events, and reasoning blocks in real-time.

```
           ▓██▓▒░░▒▓██▓
       ▓██▒     ░  ░   ▒██▓
     █▓▒  ░  ▒▓█████▓▒  ░ ▒▓█
    █▓▒░ ▒▓████  ◉  ████▓▒ ░▒▓█
     █▓▒  ░  ▒▓█████▓▒  ░ ▒▓█
       ▓██▒     ░     ░▒██▓
           ▓██▓▒░░▒▓██▓

   ╔═══════════════════════════════════╗
   ║   O B S E R V E - C L A U D E   ║
   ╚═══════════════════════════════════╝
```

## Install

```bash
git clone <this-repo>
cd observe-claude
npm install -g .
```

Requires Node >= 18. The `observe-claude` command is now available globally.

## Usage

### List sessions

```bash
observe-claude sessions          # sessions for the current project directory
observe-claude sessions --all    # all sessions across all projects
```

### Live monitoring

Run any of these in a separate terminal while Claude Code is active:

```bash
observe-claude context           # context window gauge (token usage %)
observe-claude cost              # token counts and dollar cost
observe-claude events            # tool use / event log
observe-claude reasoning         # assistant reasoning trace
```

While monitoring, press `s` to switch sessions or `q` to quit.

By default, these auto-detect the session for the current working directory. If multiple sessions exist for the project, an interactive picker is shown. To target a specific session, pass an ID prefix:

```bash
observe-claude context -s 3a32b02c
```

### Multi-pane (tmux)

Inside a tmux session:

```bash
observe-claude launch
```

Splits into 4 panes (context, cost, events, reasoning) with the eye logo in the top-left.

### Hooks

Hooks give richer event data by having Claude Code write structured events as they happen. They are installed **globally** into `~/.claude/settings.local.json` and apply to all Claude Code sessions across all projects. No files are added to any project.

```bash
observe-claude init        # install hooks
observe-claude teardown    # remove hooks
```

Event data is written to `~/.observe-claude/events/`.

## How it works

Claude Code stores sessions as JSONL files at `~/.claude/projects/<encoded-path>/<session-uuid>.jsonl`. Each assistant response is streamed as multiple JSONL lines sharing the same `message.id`. observe-claude tails these files with chokidar, consolidates streaming chunks, and renders the data with [Ink](https://github.com/vadimdemedes/ink).

No data is sent anywhere. Everything is local and read-only.

## Development

```bash
npm test          # run unit tests
npm run build     # build with tsup
npm run lint      # biome check
```
