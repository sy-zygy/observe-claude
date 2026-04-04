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
  formatCost,
  formatTokens
} from "./chunk-FIYYOTHC.js";

// src/commands/cost.tsx
import process from "process";
import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";

// src/core/model-pricing.ts
var PRICING = {
  // Claude 4.x / Opus
  "claude-opus-4-6": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheCreationPerMillion: 18.75,
    cacheReadPerMillion: 1.5
  },
  "claude-opus-4-0-20250514": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheCreationPerMillion: 18.75,
    cacheReadPerMillion: 1.5
  },
  // Claude 4.5 / Sonnet
  "claude-sonnet-4-5-20250929": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheCreationPerMillion: 3.75,
    cacheReadPerMillion: 0.3
  },
  // Claude 4.0 / Sonnet
  "claude-sonnet-4-0-20250514": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheCreationPerMillion: 3.75,
    cacheReadPerMillion: 0.3
  },
  // Claude 3.5 Sonnet
  "claude-sonnet-4-5-20250514": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheCreationPerMillion: 3.75,
    cacheReadPerMillion: 0.3
  },
  "claude-3-5-sonnet-20241022": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheCreationPerMillion: 3.75,
    cacheReadPerMillion: 0.3
  },
  // Claude 4.5 / Haiku
  "claude-haiku-4-5-20251001": {
    inputPerMillion: 0.8,
    outputPerMillion: 4,
    cacheCreationPerMillion: 1,
    cacheReadPerMillion: 0.08
  },
  // Claude 3.5 Haiku
  "claude-3-5-haiku-20241022": {
    inputPerMillion: 0.8,
    outputPerMillion: 4,
    cacheCreationPerMillion: 1,
    cacheReadPerMillion: 0.08
  }
};
var DEFAULT_PRICING = {
  inputPerMillion: 3,
  outputPerMillion: 15,
  cacheCreationPerMillion: 3.75,
  cacheReadPerMillion: 0.3
};
function getModelPricing(model) {
  if (PRICING[model]) return PRICING[model];
  for (const [key, pricing] of Object.entries(PRICING)) {
    if (model.startsWith(key) || key.startsWith(model)) {
      return pricing;
    }
  }
  return DEFAULT_PRICING;
}
function calculateCost(model, inputTokens, outputTokens, cacheCreationTokens = 0, cacheReadTokens = 0) {
  const pricing = getModelPricing(model);
  return inputTokens * pricing.inputPerMillion / 1e6 + outputTokens * pricing.outputPerMillion / 1e6 + cacheCreationTokens * pricing.cacheCreationPerMillion / 1e6 + cacheReadTokens * pricing.cacheReadPerMillion / 1e6;
}

// src/core/usage-aggregator.ts
function createUsageAggregator() {
  let totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalCostUSD: 0,
    messageCount: 0,
    seenMessageIds: /* @__PURE__ */ new Set()
  };
  const messageUsage = /* @__PURE__ */ new Map();
  function processLine(line) {
    if (line.type !== "assistant") return;
    const msg = line;
    const id = msg.message?.id;
    const usage = msg.message?.usage;
    const model = msg.message?.model ?? "";
    if (!id || !usage) return;
    const current = {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      cacheCreate: usage.cache_creation_input_tokens ?? 0,
      cacheRead: usage.cache_read_input_tokens ?? 0,
      model
    };
    const prev = messageUsage.get(id);
    if (prev) {
      totals.inputTokens -= prev.input;
      totals.outputTokens -= prev.output;
      totals.cacheCreationTokens -= prev.cacheCreate;
      totals.cacheReadTokens -= prev.cacheRead;
      totals.totalCostUSD -= calculateCost(
        prev.model,
        prev.input,
        prev.output,
        prev.cacheCreate,
        prev.cacheRead
      );
    } else {
      totals.messageCount++;
      totals.seenMessageIds.add(id);
    }
    messageUsage.set(id, current);
    totals.inputTokens += current.input;
    totals.outputTokens += current.output;
    totals.cacheCreationTokens += current.cacheCreate;
    totals.cacheReadTokens += current.cacheRead;
    totals.totalCostUSD += calculateCost(
      model,
      current.input,
      current.output,
      current.cacheCreate,
      current.cacheRead
    );
  }
  function getTotals() {
    return { ...totals };
  }
  function reset() {
    totals = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalCostUSD: 0,
      messageCount: 0,
      seenMessageIds: /* @__PURE__ */ new Set()
    };
    messageUsage.clear();
  }
  return { processLine, getTotals, reset };
}

// src/commands/cost.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function CostApp({ session }) {
  const { state: sessionState, pick, repick } = useSessionResolver(session);
  if (sessionState.status === "loading") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "cost" }),
      /* @__PURE__ */ jsx(Text, { color: colors.warning, children: "\u2591\u2592\u2593 Resolving session... \u2593\u2592\u2591" })
    ] });
  }
  if (sessionState.status === "error") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "cost" }),
      /* @__PURE__ */ jsxs(Text, { color: colors.error, children: [
        "Error: ",
        sessionState.message
      ] })
    ] });
  }
  if (sessionState.status === "pick") {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Header, { compact: true, subtitle: "cost" }),
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsx(SessionPicker, { sessions: sessionState.sessions, onSelect: pick }) })
    ] });
  }
  return /* @__PURE__ */ jsx(CostView, { session: sessionState.session, onRepick: repick });
}
var EMPTY_TOTALS = {
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
  totalCostUSD: 0,
  messageCount: 0,
  seenMessageIds: /* @__PURE__ */ new Set()
};
function CostView({ session, onRepick }) {
  useInput((input) => {
    if (input === "q") process.exit(0);
    if (input === "s") onRepick();
  });
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(() => {
    let tailer = null;
    (async () => {
      const aggregator = createUsageAggregator();
      tailer = new JsonlTailer(session.jsonlPath);
      tailer.on("line", (line) => {
        aggregator.processLine(line);
        setTotals({ ...aggregator.getTotals() });
        setLastUpdate(/* @__PURE__ */ new Date());
      });
      tailer.on("truncated", () => {
        aggregator.reset();
        setTotals({ ...aggregator.getTotals() });
      });
      await tailer.start();
    })();
    return () => {
      tailer?.stop();
    };
  }, [session.jsonlPath]);
  const totalTokens = totals.inputTokens + totals.outputTokens + totals.cacheCreationTokens + totals.cacheReadTokens;
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        compact: true,
        sessionId: session.sessionId,
        projectPath: session.projectPath,
        subtitle: "cost tracker"
      }
    ),
    /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: colors.secondary, bold: true, children: "\u2554\u2550\u2550 Token Usage \u2550\u2550\u2557" }),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Input:          " }),
          /* @__PURE__ */ jsx(Text, { color: colors.primary, bold: true, children: formatTokens(totals.inputTokens) })
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Output:         " }),
          /* @__PURE__ */ jsx(Text, { color: colors.accent, bold: true, children: formatTokens(totals.outputTokens) })
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Cache Create:   " }),
          /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: formatTokens(totals.cacheCreationTokens) })
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Cache Read:     " }),
          /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: formatTokens(totals.cacheReadTokens) })
        ] }),
        /* @__PURE__ */ jsx(Text, { children: /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" }) }),
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Total:          " }),
          /* @__PURE__ */ jsx(Text, { color: colors.bright, bold: true, children: formatTokens(totalTokens) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
        /* @__PURE__ */ jsx(Text, { color: colors.secondary, bold: true, children: "\u2554\u2550\u2550 Cost \u2550\u2550\u2557" }),
        /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Estimated:  " }),
          /* @__PURE__ */ jsx(Text, { color: colors.warning, bold: true, children: formatCost(totals.totalCostUSD) })
        ] }) }),
        /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "  Messages:   " }),
          /* @__PURE__ */ jsx(Text, { color: colors.text, children: totals.messageCount })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(StatusBar, { lastUpdate })
  ] });
}
export {
  CostApp
};
//# sourceMappingURL=cost-FJYV77RO.js.map