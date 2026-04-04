import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  colors,
  shades
} from "./chunk-FIYYOTHC.js";

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
  Header
};
//# sourceMappingURL=chunk-R4DGJ4C2.js.map