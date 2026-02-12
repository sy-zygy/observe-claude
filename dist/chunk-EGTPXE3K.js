import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  colors,
  formatRelativeTime,
  formatTimestamp,
  shades
} from "./chunk-EOE7C7BZ.js";
import {
  listSessionsForProject,
  resolveSession
} from "./chunk-XSIEMPSQ.js";

// src/ui/SessionPicker.tsx
import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function SessionPicker({ sessions, onSelect }) {
  const [cursor, setCursor] = useState(0);
  useInput((_input, key) => {
    if (key.upArrow) {
      setCursor((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCursor((prev) => Math.min(sessions.length - 1, prev + 1));
    } else if (key.return) {
      onSelect(sessions[cursor]);
    }
  });
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsxs(Text, { color: colors.warning, children: [
      shades.light,
      shades.medium,
      shades.dark,
      " Multiple sessions found for this project ",
      shades.dark,
      shades.medium,
      shades.light
    ] }),
    /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "Use \u2191\u2193 to select, Enter to confirm" }),
    /* @__PURE__ */ jsx(Box, { flexDirection: "column", marginTop: 1, children: sessions.map((session, idx) => {
      const selected = idx === cursor;
      const idShort = session.sessionId.slice(0, 8);
      const modified = session.modified ? formatRelativeTime(session.modified) : "unknown";
      const name = session.name ?? "";
      return /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.accent : colors.dim, children: selected ? "\u25B8 " : "  " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.secondary : colors.text, bold: selected, children: idShort }),
        /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " \u2502 " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.text : colors.dim, children: modified.padEnd(10) }),
        /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " \u2502 " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.primary : colors.dim, children: name || "(unnamed)" })
      ] }, session.sessionId);
    }) })
  ] });
}

// src/ui/StatusBar.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function StatusBar({ lastUpdate, eventCount, hooksActive }) {
  const parts = [];
  if (lastUpdate) {
    parts.push(`updated ${formatTimestamp(lastUpdate)}`);
  }
  if (eventCount !== void 0) {
    parts.push(`${eventCount} events`);
  }
  if (hooksActive) {
    parts.push("hooks: active");
  }
  return /* @__PURE__ */ jsxs2(Box2, { marginTop: 1, children: [
    /* @__PURE__ */ jsxs2(Text2, { color: colors.dim, children: [
      shades.light,
      shades.medium,
      shades.dark,
      " ",
      parts.join(" \u2502 "),
      " ",
      shades.dark,
      shades.medium,
      shades.light
    ] }),
    /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: " (q to quit)" })
  ] });
}

// src/ui/useSessionResolver.ts
import { useEffect, useState as useState2 } from "react";
function useSessionResolver(sessionId) {
  const [state, setState] = useState2({ status: "loading" });
  useEffect(() => {
    (async () => {
      try {
        if (sessionId) {
          const session = await resolveSession({ sessionId });
          if (!session) {
            setState({
              status: "error",
              message: `No session found matching "${sessionId}".`
            });
            return;
          }
          setState({ status: "resolved", session });
          return;
        }
        const sessions = await listSessionsForProject(process.cwd());
        if (sessions.length === 0) {
          const session = await resolveSession();
          if (!session) {
            setState({
              status: "error",
              message: "No session found. Use --session <id> or run from a project directory."
            });
            return;
          }
          setState({ status: "resolved", session });
          return;
        }
        if (sessions.length === 1) {
          setState({ status: "resolved", session: sessions[0] });
          return;
        }
        setState({ status: "pick", sessions });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err)
        });
      }
    })();
  }, [sessionId]);
  function pick(session) {
    setState({ status: "resolved", session });
  }
  return { state, pick };
}

export {
  SessionPicker,
  StatusBar,
  useSessionResolver
};
//# sourceMappingURL=chunk-EGTPXE3K.js.map