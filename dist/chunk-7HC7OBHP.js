import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// src/core/hooks-manager.ts
import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
var CLAUDE_DIR = join(homedir(), ".claude");
var SETTINGS_PATH = join(CLAUDE_DIR, "settings.local.json");
var OBSERVE_DIR = join(homedir(), ".observe-claude");
var EVENTS_DIR = join(OBSERVE_DIR, "events");
var HOOK_SCRIPT = join(
  resolve(fileURLToPath(import.meta.url), "../.."),
  "hooks",
  "observe-claude-hook.mjs"
);
var HOOK_EVENTS = ["PreToolUse", "PostToolUse", "Stop", "PreCompact", "SessionStart"];
var HOOK_MARKER = "observe-claude";
async function readSettings() {
  try {
    const content = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}
async function writeSettings(settings) {
  await mkdir(CLAUDE_DIR, { recursive: true });
  await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}
`, "utf-8");
}
async function installHooks() {
  await mkdir(EVENTS_DIR, { recursive: true });
  const settings = await readSettings();
  if (!settings.hooks || typeof settings.hooks !== "object") {
    settings.hooks = {};
  }
  const hooks = settings.hooks;
  let anyInstalled = false;
  for (const event of HOOK_EVENTS) {
    if (!hooks[event] || !Array.isArray(hooks[event])) {
      hooks[event] = [];
    }
    const eventHooks = hooks[event];
    const alreadyInstalled = eventHooks.some(
      (h) => typeof h.command === "string" && h.command.includes(HOOK_MARKER)
    );
    if (!alreadyInstalled) {
      eventHooks.push({
        command: `node "${HOOK_SCRIPT}"`
      });
      anyInstalled = true;
    }
  }
  if (anyInstalled) {
    await writeSettings(settings);
  }
  return {
    installed: anyInstalled,
    settingsPath: SETTINGS_PATH,
    hookScript: HOOK_SCRIPT
  };
}
async function removeHooks() {
  const settings = await readSettings();
  if (!settings.hooks || typeof settings.hooks !== "object") {
    return { removed: false, settingsPath: SETTINGS_PATH };
  }
  const hooks = settings.hooks;
  let anyRemoved = false;
  for (const event of HOOK_EVENTS) {
    if (!Array.isArray(hooks[event])) continue;
    const eventHooks = hooks[event];
    const filtered = eventHooks.filter(
      (h) => !(typeof h.command === "string" && h.command.includes(HOOK_MARKER))
    );
    if (filtered.length !== eventHooks.length) {
      anyRemoved = true;
      hooks[event] = filtered;
    }
    if (filtered.length === 0) {
      delete hooks[event];
    }
  }
  if (anyRemoved) {
    if (Object.keys(hooks).length === 0) {
      settings.hooks = void 0;
    }
    await writeSettings(settings);
  }
  return { removed: anyRemoved, settingsPath: SETTINGS_PATH };
}

export {
  installHooks,
  removeHooks
};
//# sourceMappingURL=chunk-7HC7OBHP.js.map