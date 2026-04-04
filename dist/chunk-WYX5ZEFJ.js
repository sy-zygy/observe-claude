import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  colors,
  formatTimestamp,
  listAllSessions,
  listSessionsForProject,
  resolveSession,
  shades
} from "./chunk-FIYYOTHC.js";

// src/ui/StatusBar.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs(Box, { marginTop: 1, children: [
    /* @__PURE__ */ jsxs(Text, { color: colors.dim, children: [
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
    /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " (s: sessions, q: quit)" })
  ] });
}

// src/ui/useSessionResolver.ts
import { useCallback, useEffect, useState } from "react";
function useSessionResolver(sessionId) {
  const [state, setState] = useState({ status: "loading" });
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
        setState({ status: "pick", sessions: sessions.slice(0, 8) });
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
  const repick = useCallback(() => {
    (async () => {
      try {
        const sessions = await listAllSessions();
        if (sessions.length > 0) {
          setState({ status: "pick", sessions: sessions.slice(0, 8) });
        }
      } catch {
      }
    })();
  }, []);
  return { state, pick, repick };
}

export {
  StatusBar,
  useSessionResolver
};
//# sourceMappingURL=chunk-WYX5ZEFJ.js.map