import { createRequire } from 'module'; const require = createRequire(import.meta.url);

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

// src/ui/Header.tsx
import { Box, Text } from "ink";

// src/ui/AsciiArt.ts
var { light, medium, dark, full } = shades;
var EYE_LOGO = [
  "      _.---._",
  `    .'   ${dark}${full}${full}${full}   '.`,
  `   /  ${dark}${full}${full}  ${medium}(${full})${medium}  ${dark}${full}${full}  \\`,
  `    '.   ${dark}${full}${full}${full}   .'`,
  `      '-.___.-'`
].join("\n");
var BANNER_COMPACT = `${dark}${full}${dark} OBSERVE-CLAUDE ${dark}${full}${dark}`;
var TITLE = [
  `${medium}${dark}${full}${full}${dark}${medium}  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557  ${medium}${dark}${full}${full}${dark}${medium}`,
  `${dark}${full}${full}${dark}    \u2551   O B S E R V E - C L A U D E   \u2551    ${dark}${full}${full}${dark}`,
  `${medium}${dark}${full}${full}${dark}${medium}  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D  ${medium}${dark}${full}${full}${dark}${medium}`,
  `           ${light} read-only session monitor ${light}`
].join("\n");
var FULL_BANNER = `${EYE_LOGO}

${TITLE}`;
var DIVIDER = `${light}${medium}${dark}${full}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${full}${dark}${medium}${light}`;

// src/ui/Header.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Header({
  compact = false,
  showEye = false,
  sessionId,
  projectPath,
  subtitle
}) {
  if (compact) {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: colors.primary, children: BANNER_COMPACT }),
      sessionId && /* @__PURE__ */ jsxs(Text, { children: [
        /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "session: " }),
        /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: sessionId.slice(0, 8) }),
        projectPath && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Text, { color: colors.dim, children: " \u2502 " }),
          /* @__PURE__ */ jsx(Text, { color: colors.text, children: projectPath })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(Text, { color: colors.primary, children: showEye ? FULL_BANNER : TITLE }),
    /* @__PURE__ */ jsx(Text, { color: colors.accent, children: DIVIDER }),
    sessionId && /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "session: " }),
      /* @__PURE__ */ jsxs(Text, { color: colors.secondary, children: [
        sessionId.slice(0, 8),
        "..."
      ] })
    ] }) }),
    projectPath && /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: colors.dim, children: "project: " }),
      /* @__PURE__ */ jsx(Text, { color: colors.text, children: projectPath })
    ] }),
    subtitle && /* @__PURE__ */ jsx(Text, { color: colors.warning, children: subtitle })
  ] });
}

export {
  colors,
  borders,
  progressChars,
  shades,
  formatTimestamp,
  formatRelativeTime,
  formatTokens,
  formatCost,
  Header
};
//# sourceMappingURL=chunk-EOE7C7BZ.js.map