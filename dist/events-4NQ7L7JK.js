import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  ScrollingLog
} from "./chunk-CTJP4ZRK.js";
import {
  SessionPicker,
  StatusBar,
  useSessionResolver
} from "./chunk-EGTPXE3K.js";
import {
  Header,
  colors,
  formatTimestamp
} from "./chunk-EOE7C7BZ.js";
import {
  JsonlTailer
} from "./chunk-XSIEMPSQ.js";

// src/commands/events.tsx
import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function EventsApp({ session }) {
  const { state: sessionState, pick } = useSessionResolver(session);
  if (sessionState.status === "loading") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "events" }),
      /* @__PURE__ */ jsx(Text, { color: colors.warning, children: "\u2591\u2592\u2593 Resolving session... \u2593\u2592\u2591" })
    ] });
  }
  if (sessionState.status === "error") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "events" }),
      /* @__PURE__ */ jsxs(Text, { color: colors.error, children: [
        "Error: ",
        sessionState.message
      ] })
    ] });
  }
  if (sessionState.status === "pick") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "events" }),
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsx(SessionPicker, { sessions: sessionState.sessions, onSelect: pick }) })
    ] });
  }
  return /* @__PURE__ */ jsx(EventsView, { session: sessionState.session });
}
function EventsView({ session }) {
  const [events, setEvents] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(() => {
    let tailer = null;
    (async () => {
      tailer = new JsonlTailer(session.jsonlPath);
      tailer.on("line", (line) => {
        const newEvents = extractEvents(line);
        if (newEvents.length > 0) {
          setEvents((prev) => [...prev, ...newEvents].slice(-200));
          setLastUpdate(/* @__PURE__ */ new Date());
        }
      });
      await tailer.start();
    })();
    return () => {
      tailer?.stop();
    };
  }, [session.jsonlPath]);
  const logLines = events.map((e) => ({
    text: `${formatTimestamp(e.timestamp)} ${e.type.padEnd(12)} ${e.detail}`,
    color: e.color
  }));
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        compact: true,
        sessionId: session.sessionId,
        projectPath: session.projectPath,
        subtitle: "event log"
      }
    ),
    /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: colors.secondary, bold: true, children: "\u2554\u2550\u2550 Tool / Event Log \u2550\u2550\u2557" }),
      /* @__PURE__ */ jsx(ScrollingLog, { lines: logLines, maxVisible: 20 })
    ] }),
    /* @__PURE__ */ jsx(StatusBar, { lastUpdate, eventCount: events.length })
  ] });
}
function extractEvents(line) {
  const now = /* @__PURE__ */ new Date();
  const events = [];
  switch (line.type) {
    case "user": {
      const content = line.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "tool_result") {
            events.push({
              timestamp: now,
              type: "tool_result",
              detail: `${block.tool_use_id.slice(0, 12)}${block.is_error ? " [ERROR]" : ""}`,
              color: block.is_error ? colors.error : colors.text
            });
          }
        }
      } else if (typeof content === "string") {
        events.push({
          timestamp: now,
          type: "user_msg",
          detail: content.slice(0, 80),
          color: colors.secondary
        });
      }
      break;
    }
    case "assistant": {
      const msg = line.message;
      if (msg?.content) {
        for (const block of msg.content) {
          if (block.type === "tool_use") {
            const toolBlock = block;
            const inputPreview = summarizeToolInput(toolBlock.name, toolBlock.input);
            events.push({
              timestamp: now,
              type: "tool_use",
              detail: `${toolBlock.name} ${inputPreview}`,
              color: colors.accent
            });
          } else if (block.type === "text") {
            events.push({
              timestamp: now,
              type: "text",
              detail: block.text.slice(0, 80),
              color: colors.primary
            });
          }
        }
      }
      break;
    }
    case "system": {
      const content = line.message?.content ?? "";
      events.push({
        timestamp: now,
        type: "system",
        detail: content.slice(0, 80),
        color: colors.warning
      });
      break;
    }
  }
  return events;
}
function summarizeToolInput(toolName, input) {
  switch (toolName) {
    case "Read":
    case "Write":
    case "Edit":
      return String(input.file_path ?? "").split("/").pop() ?? "";
    case "Bash":
      return String(input.command ?? "").slice(0, 50);
    case "Glob":
      return String(input.pattern ?? "");
    case "Grep":
      return String(input.pattern ?? "");
    default:
      return "";
  }
}
export {
  EventsApp
};
//# sourceMappingURL=events-4NQ7L7JK.js.map