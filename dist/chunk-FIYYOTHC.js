import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// src/core/jsonl-parser.ts
import { EventEmitter } from "events";
import { readFile } from "fs/promises";
function parseLine(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      return parsed;
    }
    if (parsed?.message?.role === "assistant") {
      return { type: "assistant", ...parsed };
    }
    if (parsed?.message?.role === "user") {
      return { type: "user", ...parsed };
    }
    if (parsed?.message?.role === "system") {
      return { type: "system", ...parsed };
    }
    return null;
  } catch {
    return null;
  }
}
var JsonlTailer = class extends EventEmitter {
  path;
  offset = 0;
  watcher = null;
  closed = false;
  constructor(path) {
    super();
    this.path = path;
  }
  async start() {
    try {
      const content = await readFile(this.path, "utf-8");
      this.offset = Buffer.byteLength(content, "utf-8");
      for (const rawLine of content.split("\n")) {
        const line = parseLine(rawLine);
        if (line) this.emit("line", line);
      }
    } catch {
      this.offset = 0;
    }
    const { watch } = await import("chokidar");
    const w = watch(this.path, {
      persistent: true,
      usePolling: false,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
    });
    this.watcher = w;
    w.on("change", async () => {
      if (this.closed) return;
      await this.readNewLines();
    });
  }
  async readNewLines() {
    try {
      const content = await readFile(this.path, "utf-8");
      const totalBytes = Buffer.byteLength(content, "utf-8");
      if (totalBytes < this.offset) {
        this.offset = 0;
        this.emit("truncated");
      }
      const newContent = Buffer.from(content, "utf-8").subarray(this.offset).toString("utf-8");
      this.offset = totalBytes;
      if (!newContent) return;
      for (const rawLine of newContent.split("\n")) {
        const line = parseLine(rawLine);
        if (line) this.emit("line", line);
      }
    } catch {
    }
  }
  async stop() {
    this.closed = true;
    if (this.watcher && typeof this.watcher.close === "function") {
      await this.watcher.close();
    }
    this.removeAllListeners();
  }
};

// src/core/session-resolver.ts
import { createHash } from "crypto";
import { readFile as readFile2, readdir, stat } from "fs/promises";
import { homedir } from "os";
import { join, resolve } from "path";
var CLAUDE_DIR = join(homedir(), ".claude");
var PROJECTS_DIR = join(CLAUDE_DIR, "projects");
var MAX_ENCODED_LENGTH = 200;
function encodeProjectPath(cwd) {
  const absolute = resolve(cwd);
  const encoded = absolute.replace(/[^a-zA-Z0-9]/g, "-");
  if (encoded.length <= MAX_ENCODED_LENGTH) return encoded;
  const hash = createHash("sha256").update(absolute).digest("hex").slice(0, 8);
  return `${encoded.slice(0, MAX_ENCODED_LENGTH)}-${hash}`;
}
function decodeProjectPath(encoded) {
  return encoded.replace(/-/g, "/");
}
async function dirExists(path) {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}
async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}
async function readSessionsIndex(projectDir) {
  const indexPath = join(projectDir, "sessions-index.json");
  try {
    const content = await readFile2(indexPath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.sessions)) {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return { sessions: parsed };
    }
    return null;
  } catch {
    return null;
  }
}
async function scanJsonlFiles(projectDir) {
  const encodedPath = projectDir.split("/").pop() ?? "";
  try {
    const entries = await readdir(projectDir);
    const jsonlFiles = entries.filter((e) => e.endsWith(".jsonl"));
    const sessions = [];
    for (const file of jsonlFiles) {
      const sessionId = file.replace(".jsonl", "");
      const filePath = join(projectDir, file);
      try {
        const s = await stat(filePath);
        sessions.push({
          sessionId,
          projectPath: decodeProjectPath(encodedPath),
          encodedPath,
          jsonlPath: filePath,
          modified: s.mtime,
          created: s.birthtime
        });
      } catch {
      }
    }
    sessions.sort((a, b) => {
      const aTime = a.modified?.getTime() ?? 0;
      const bTime = b.modified?.getTime() ?? 0;
      return bTime - aTime;
    });
    return sessions;
  } catch {
    return [];
  }
}
async function listAllSessions() {
  if (!await dirExists(PROJECTS_DIR)) {
    return [];
  }
  const projectDirs = await readdir(PROJECTS_DIR);
  const allSessions = [];
  for (const encoded of projectDirs) {
    const projectDir = join(PROJECTS_DIR, encoded);
    if (!await dirExists(projectDir)) continue;
    const index = await readSessionsIndex(projectDir);
    if (index) {
      for (const entry of index.sessions) {
        const jsonlPath = join(projectDir, `${entry.sessionId}.jsonl`);
        const _exists = await fileExists(jsonlPath);
        allSessions.push({
          sessionId: entry.sessionId,
          projectPath: decodeProjectPath(encoded),
          encodedPath: encoded,
          jsonlPath,
          name: entry.name,
          created: entry.created ? new Date(entry.created) : void 0,
          modified: entry.modified ? new Date(entry.modified) : void 0,
          lastCwd: entry.lastCwd
        });
      }
    } else {
      const scanned = await scanJsonlFiles(projectDir);
      allSessions.push(...scanned);
    }
  }
  allSessions.sort((a, b) => {
    const aTime = a.modified?.getTime() ?? 0;
    const bTime = b.modified?.getTime() ?? 0;
    return bTime - aTime;
  });
  return allSessions;
}
async function listSessionsForProject(cwd) {
  const encoded = encodeProjectPath(cwd);
  const projectDir = join(PROJECTS_DIR, encoded);
  if (!await dirExists(projectDir)) {
    return [];
  }
  const index = await readSessionsIndex(projectDir);
  if (index) {
    const sessions = [];
    for (const entry of index.sessions) {
      const jsonlPath = join(projectDir, `${entry.sessionId}.jsonl`);
      sessions.push({
        sessionId: entry.sessionId,
        projectPath: cwd,
        encodedPath: encoded,
        jsonlPath,
        name: entry.name,
        created: entry.created ? new Date(entry.created) : void 0,
        modified: entry.modified ? new Date(entry.modified) : void 0,
        lastCwd: entry.lastCwd
      });
    }
    sessions.sort((a, b) => {
      const aTime = a.modified?.getTime() ?? 0;
      const bTime = b.modified?.getTime() ?? 0;
      return bTime - aTime;
    });
    return sessions;
  }
  return scanJsonlFiles(projectDir);
}
async function resolveSession(opts = {}) {
  if (opts.sessionId) {
    const all2 = await listAllSessions();
    const prefix = opts.sessionId;
    const match2 = all2.find((s) => s.sessionId.startsWith(prefix));
    return match2 ?? null;
  }
  const cwd = opts.cwd ?? process.cwd();
  const sessions = await listSessionsForProject(cwd);
  if (sessions.length > 0) {
    return sessions[0];
  }
  const all = await listAllSessions();
  const cwdEncoded = encodeProjectPath(resolve(cwd));
  const match = all.find((s) => s.encodedPath === cwdEncoded);
  return match ?? null;
}
async function getSessionPreview(jsonlPath) {
  try {
    const content = await readFile2(jsonlPath, "utf-8");
    const lines = content.split("\n");
    for (const rawLine of lines) {
      const line = parseLine(rawLine);
      if (!line) continue;
      if (line.type === "user" && line.message?.content) {
        const content2 = line.message.content;
        if (typeof content2 === "string") {
          return content2.slice(0, 120);
        }
        for (const block of content2) {
          if ("text" in block && block.type === "text") {
            return block.text.slice(0, 120);
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// src/ui/theme.ts
var colors = {
  primary: "#00FF41",
  // Matrix green
  secondary: "#00BFFF",
  // Electric cyan
  accent: "#FF6600",
  // Orange
  warning: "#FFD700",
  // Gold
  error: "#FF0040",
  // Hot red
  dim: "#666666",
  // Dimmed text
  bg: "#000000",
  // Background
  text: "#CCCCCC",
  // Default text
  bright: "#FFFFFF"
  // Bright white
};
var borders = {
  topLeft: "\u2554",
  topRight: "\u2557",
  bottomLeft: "\u255A",
  bottomRight: "\u255D",
  horizontal: "\u2550",
  vertical: "\u2551",
  teeLeft: "\u2560",
  teeRight: "\u2563",
  teeTop: "\u2566",
  teeBottom: "\u2569",
  cross: "\u256C"
};
var progressChars = {
  full: "\u2588",
  threequarter: "\u2593",
  half: "\u2592",
  quarter: "\u2591",
  empty: " "
};
var shades = {
  light: "\u2591",
  medium: "\u2592",
  dark: "\u2593",
  full: "\u2588"
};
function formatTimestamp(date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function formatRelativeTime(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1e3);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
function formatTokens(count) {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K`;
  return String(count);
}
function formatCost(usd) {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export {
  JsonlTailer,
  listAllSessions,
  listSessionsForProject,
  resolveSession,
  getSessionPreview,
  colors,
  borders,
  progressChars,
  shades,
  formatTimestamp,
  formatRelativeTime,
  formatTokens,
  formatCost
};
//# sourceMappingURL=chunk-FIYYOTHC.js.map