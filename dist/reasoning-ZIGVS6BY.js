import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  ScrollingLog
} from "./chunk-IAJFXXXQ.js";
import {
  StatusBar,
  useSessionResolver
} from "./chunk-WYX5ZEFJ.js";
import {
  Header
} from "./chunk-R4DGJ4C2.js";
import {
  SessionPicker
} from "./chunk-VXE4UZJ4.js";
import {
  JsonlTailer,
  colors
} from "./chunk-FIYYOTHC.js";

// src/commands/reasoning.tsx
import process from "process";
import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function ReasoningApp({ session }) {
  const { state: sessionState, pick, repick } = useSessionResolver(session);
  if (sessionState.status === "loading") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "reasoning" }),
      /* @__PURE__ */ jsx(Text, { color: colors.warning, children: "\u2591\u2592\u2593 Resolving session... \u2593\u2592\u2591" })
    ] });
  }
  if (sessionState.status === "error") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "reasoning" }),
      /* @__PURE__ */ jsxs(Text, { color: colors.error, children: [
        "Error: ",
        sessionState.message
      ] })
    ] });
  }
  if (sessionState.status === "pick") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "reasoning" }),
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsx(SessionPicker, { sessions: sessionState.sessions, onSelect: pick }) })
    ] });
  }
  return /* @__PURE__ */ jsx(ReasoningView, { session: sessionState.session, onRepick: repick });
}
function ReasoningView({ session, onRepick }) {
  useInput((input) => {
    if (input === "q") process.exit(0);
    if (input === "s") onRepick();
  });
  const [thinkingBlocks, setThinkingBlocks] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(() => {
    let tailer = null;
    (async () => {
      tailer = new JsonlTailer(session.jsonlPath);
      tailer.on("line", (line) => {
        if (line.type !== "assistant") return;
        const msg = line.message;
        if (!msg?.content) return;
        for (const block of msg.content) {
          if (block.type === "thinking") {
            const thinking = block;
            setThinkingBlocks(
              (prev) => [
                ...prev,
                {
                  messageId: msg.id,
                  text: thinking.thinking,
                  truncated: thinking.thinking.length > 500
                }
              ].slice(-50)
            );
            setLastUpdate(/* @__PURE__ */ new Date());
          }
        }
      });
      await tailer.start();
    })();
    return () => {
      tailer?.stop();
    };
  }, [session.jsonlPath]);
  const logLines = thinkingBlocks.map((entry) => {
    const preview = entry.text.slice(0, 200).replace(/\n/g, " ");
    return {
      text: `[${entry.messageId.slice(0, 8)}] ${preview}${entry.truncated ? "\u2026" : ""}`,
      color: colors.primary
    };
  });
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        compact: true,
        sessionId: session.sessionId,
        projectPath: session.projectPath,
        subtitle: "reasoning (experimental)"
      }
    ),
    /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: colors.secondary, bold: true, children: "\u2554\u2550\u2550 Thinking Blocks \u2550\u2550\u2557" }),
      thinkingBlocks.length === 0 ? /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "Waiting for thinking blocks... (extended thinking must be enabled)" }) : /* @__PURE__ */ jsx(ScrollingLog, { lines: logLines, maxVisible: 15 })
    ] }),
    /* @__PURE__ */ jsx(StatusBar, { lastUpdate })
  ] });
}
export {
  ReasoningApp
};
//# sourceMappingURL=reasoning-ZIGVS6BY.js.map