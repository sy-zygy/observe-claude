import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  colors,
  formatRelativeTime,
  shades
} from "./chunk-FIYYOTHC.js";

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
      const project = session.projectPath.split("/").filter(Boolean).slice(-2).join("/");
      return /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.accent : colors.dim, children: selected ? "\u25B8 " : "  " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.secondary : colors.text, bold: selected, children: idShort }),
        /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " \u2502 " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.text : colors.dim, children: modified.padEnd(10) }),
        /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " \u2502 " }),
        /* @__PURE__ */ jsx(Text, { color: selected ? colors.primary : colors.dim, children: project })
      ] }, session.sessionId);
    }) })
  ] });
}

export {
  SessionPicker
};
//# sourceMappingURL=chunk-VXE4UZJ4.js.map