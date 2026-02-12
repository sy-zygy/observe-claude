import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  colors
} from "./chunk-EOE7C7BZ.js";

// src/ui/ScrollingLog.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
function ScrollingLog({ lines, maxVisible = 20 }) {
  const visible = lines.slice(-maxVisible);
  const skipped = lines.length - visible.length;
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    skipped > 0 && /* @__PURE__ */ jsxs(Text, { color: colors.dim, children: [
      " \u2191 ",
      skipped,
      " more lines above"
    ] }),
    visible.map((line, idx) => /* @__PURE__ */ jsxs(Text, { color: line.color ?? colors.text, children: [
      "  ",
      line.text
    ] }, idx)),
    visible.length === 0 && /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " Waiting for events..." })
  ] });
}

export {
  ScrollingLog
};
//# sourceMappingURL=chunk-CTJP4ZRK.js.map