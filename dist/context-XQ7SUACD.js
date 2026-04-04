import { createRequire } from 'module'; const require = createRequire(import.meta.url);
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
  colors,
  formatTokens,
  progressChars
} from "./chunk-FIYYOTHC.js";

// src/commands/context.tsx
import process from "process";
import { Box as Box3, Text as Text3, useInput } from "ink";
import { useEffect, useState } from "react";

// src/core/context-estimator.ts
var DEFAULT_MAX_TOKENS = 2e5;
function createContextEstimator(maxTokens = DEFAULT_MAX_TOKENS) {
  let currentTokens = 0;
  let compactionCount = 0;
  let _lastMessageId = null;
  function processLine(line) {
    if (line.type === "system") {
      const sys = line;
      if (sys.compact_boundary) {
        compactionCount++;
        currentTokens = 0;
        _lastMessageId = null;
      }
      return;
    }
    if (line.type === "assistant") {
      const msg = line;
      const id = msg.message?.id;
      const usage = msg.message?.usage;
      if (!usage) return;
      const totalPrompt = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
      if (totalPrompt > 0) {
        currentTokens = totalPrompt;
        _lastMessageId = id ?? null;
      }
    }
  }
  function getEstimate() {
    const percentUsed = maxTokens > 0 ? currentTokens / maxTokens * 100 : 0;
    return {
      currentTokens,
      maxTokens,
      percentUsed: Math.min(percentUsed, 100),
      compactionCount
    };
  }
  function reset() {
    currentTokens = 0;
    compactionCount = 0;
    _lastMessageId = null;
  }
  return { processLine, getEstimate, reset };
}

// src/ui/ProgressBar.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
function ProgressBar({
  value,
  width = 40,
  color = colors.primary,
  label
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledWidth = Math.round(clamped / 100 * width);
  const emptyWidth = width - filledWidth;
  let bar = "";
  for (let i = 0; i < filledWidth; i++) {
    if (i < filledWidth - 1) {
      bar += progressChars.full;
    } else {
      const frac = clamped / 100 * width - filledWidth + 1;
      if (frac > 0.75) bar += progressChars.full;
      else if (frac > 0.5) bar += progressChars.threequarter;
      else if (frac > 0.25) bar += progressChars.half;
      else bar += progressChars.quarter;
    }
  }
  for (let i = 0; i < emptyWidth; i++) {
    bar += progressChars.quarter;
  }
  return /* @__PURE__ */ jsxs(Box, { children: [
    /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "[" }),
    /* @__PURE__ */ jsx(Text, { color, children: bar }),
    /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "]" }),
    label && /* @__PURE__ */ jsxs(Text, { color, bold: true, children: [
      " ",
      label
    ] })
  ] });
}

// src/ui/TokenBreakdown.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function TokenBreakdown({ estimate }) {
  const { currentTokens, maxTokens } = estimate;
  const used = currentTokens;
  const free = Math.max(0, maxTokens - currentTokens);
  const barWidth = 40;
  const usedWidth = Math.round(used / maxTokens * barWidth);
  const freeWidth = barWidth - usedWidth;
  const usedBar = progressChars.full.repeat(usedWidth);
  const freeBar = progressChars.quarter.repeat(freeWidth);
  const usedColor = estimate.percentUsed > 90 ? colors.error : estimate.percentUsed > 70 ? colors.warning : colors.primary;
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: "Token breakdown:" }),
    /* @__PURE__ */ jsxs2(Box2, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: " Used " }),
      /* @__PURE__ */ jsx2(Text2, { color: usedColor, children: usedBar }),
      /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: freeBar }),
      /* @__PURE__ */ jsxs2(Text2, { color: usedColor, children: [
        " ",
        formatTokens(used)
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(Box2, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: " Free " }),
      /* @__PURE__ */ jsx2(Text2, { color: colors.dim, children: progressChars.quarter.repeat(usedWidth) }),
      /* @__PURE__ */ jsx2(Text2, { color: colors.secondary, children: progressChars.half.repeat(freeWidth) }),
      /* @__PURE__ */ jsxs2(Text2, { color: colors.secondary, children: [
        " ",
        formatTokens(free)
      ] })
    ] })
  ] });
}

// src/commands/context.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function ContextApp({ session, banner = false }) {
  const { state: sessionState, pick, repick } = useSessionResolver(session);
  if (sessionState.status === "loading") {
    return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx3(Header, { compact: true, subtitle: "context" }),
      /* @__PURE__ */ jsx3(Text3, { color: colors.warning, children: "\u2591\u2592\u2593 Resolving session... \u2593\u2592\u2591" })
    ] });
  }
  if (sessionState.status === "error") {
    return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx3(Header, { compact: true, subtitle: "context" }),
      /* @__PURE__ */ jsxs3(Text3, { color: colors.error, children: [
        "Error: ",
        sessionState.message
      ] })
    ] });
  }
  if (sessionState.status === "pick") {
    return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx3(Header, { compact: true, subtitle: "context" }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsx3(SessionPicker, { sessions: sessionState.sessions, onSelect: pick }) })
    ] });
  }
  return /* @__PURE__ */ jsx3(ContextView, { session: sessionState.session, banner, onRepick: repick });
}
function ContextView({
  session,
  banner,
  onRepick
}) {
  useInput((input) => {
    if (input === "q") process.exit(0);
    if (input === "s") onRepick();
  });
  const [estimate, setEstimate] = useState({
    currentTokens: 0,
    maxTokens: 2e5,
    percentUsed: 0,
    compactionCount: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(() => {
    let tailer = null;
    (async () => {
      const estimator = createContextEstimator();
      tailer = new JsonlTailer(session.jsonlPath);
      tailer.on("line", (line) => {
        estimator.processLine(line);
        setEstimate(estimator.getEstimate());
        setLastUpdate(/* @__PURE__ */ new Date());
      });
      tailer.on("truncated", () => {
        estimator.reset();
        setEstimate(estimator.getEstimate());
      });
      await tailer.start();
    })();
    return () => {
      tailer?.stop();
    };
  }, [session.jsonlPath]);
  const warningLevel = estimate.percentUsed > 90 ? "critical" : estimate.percentUsed > 70 ? "warning" : "normal";
  const barColor = warningLevel === "critical" ? colors.error : warningLevel === "warning" ? colors.warning : colors.primary;
  return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", children: [
    banner ? /* @__PURE__ */ jsx3(
      Header,
      {
        showEye: true,
        sessionId: session.sessionId,
        projectPath: session.projectPath,
        subtitle: "context window"
      }
    ) : /* @__PURE__ */ jsx3(
      Header,
      {
        compact: true,
        sessionId: session.sessionId,
        projectPath: session.projectPath,
        subtitle: "context window"
      }
    ),
    /* @__PURE__ */ jsxs3(Box3, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx3(Text3, { color: colors.secondary, bold: true, children: "\u2554\u2550\u2550 Context Window Usage \u2550\u2550\u2557" }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsx3(
        ProgressBar,
        {
          value: estimate.percentUsed,
          width: 50,
          color: barColor,
          label: `${estimate.percentUsed.toFixed(1)}%`
        }
      ) }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsxs3(Text3, { children: [
        /* @__PURE__ */ jsx3(Text3, { color: colors.dim, children: "Tokens: " }),
        /* @__PURE__ */ jsx3(Text3, { color: barColor, bold: true, children: formatTokens(estimate.currentTokens) }),
        /* @__PURE__ */ jsxs3(Text3, { color: colors.dim, children: [
          " / ",
          formatTokens(estimate.maxTokens)
        ] })
      ] }) }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsx3(TokenBreakdown, { estimate }) }),
      estimate.compactionCount > 0 && /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsxs3(Text3, { color: colors.warning, children: [
        "\u26A1 Compactions: ",
        estimate.compactionCount
      ] }) })
    ] }),
    /* @__PURE__ */ jsx3(StatusBar, { lastUpdate })
  ] });
}
export {
  ContextApp
};
//# sourceMappingURL=context-XQ7SUACD.js.map