import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import {
  Header
} from "./chunk-R4DGJ4C2.js";
import {
  borders,
  colors,
  formatRelativeTime,
  getSessionPreview,
  listAllSessions,
  listSessionsForProject
} from "./chunk-FIYYOTHC.js";

// src/commands/sessions.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { useEffect, useState } from "react";

// src/ui/Table.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
function pad(text, width, align = "left") {
  const truncated = text.length > width ? `${text.slice(0, width - 1)}\u2026` : text;
  const padding = width - truncated.length;
  if (align === "right") {
    return " ".repeat(padding) + truncated;
  }
  return truncated + " ".repeat(padding);
}
function Table({ columns, data, maxRows }) {
  const rows = maxRows ? data.slice(0, maxRows) : data;
  const colWidths = columns.map((col) => {
    const headerWidth = col.label.length;
    const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[col.key] ?? "").length), 0);
    return col.width ?? Math.min(Math.max(headerWidth, maxDataWidth) + 2, 40);
  });
  const _totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + columns.length + 1;
  const topLine = borders.topLeft + colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.teeTop) + borders.topRight;
  const headerLine = borders.vertical + columns.map((col, i) => pad(col.label, colWidths[i])).join(borders.vertical) + borders.vertical;
  const sepLine = borders.teeLeft + colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.cross) + borders.teeRight;
  const bottomLine = borders.bottomLeft + colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.teeBottom) + borders.bottomRight;
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: topLine }),
    /* @__PURE__ */ jsx(Text, { color: colors.primary, bold: true, children: headerLine }),
    /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: sepLine }),
    rows.map((row, rowIdx) => {
      const line = borders.vertical + columns.map((col, i) => pad(row[col.key] ?? "", colWidths[i], col.align)).join(borders.vertical) + borders.vertical;
      return /* @__PURE__ */ jsx(Text, { color: rowIdx === 0 ? colors.accent : colors.text, children: line }, rowIdx);
    }),
    /* @__PURE__ */ jsx(Text, { color: colors.secondary, children: bottomLine }),
    maxRows && data.length > maxRows && /* @__PURE__ */ jsx(Text, { color: colors.dim, children: ` \u2026 and ${data.length - maxRows} more sessions` })
  ] });
}

// src/commands/sessions.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function SessionsApp({ all = false, limit = 20 }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const raw = all ? await listAllSessions() : await listSessionsForProject(process.cwd());
        const rows = [];
        for (const s of raw.slice(0, limit)) {
          const preview = await getSessionPreview(s.jsonlPath);
          rows.push({
            id: s.sessionId.slice(0, 8),
            project: s.projectPath ? s.projectPath.split("/").slice(-2).join("/") : s.encodedPath.slice(0, 20),
            modified: s.modified ? formatRelativeTime(s.modified) : "unknown",
            name: s.name ?? "",
            preview: preview ?? ""
          });
        }
        setSessions(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [all, limit]);
  if (loading) {
    return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx2(Header, { compact: true, subtitle: "sessions" }),
      /* @__PURE__ */ jsx2(Text2, { color: colors.warning, children: "\u2591\u2592\u2593 Loading sessions... \u2593\u2592\u2591" })
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx2(Header, { compact: true, subtitle: "sessions" }),
      /* @__PURE__ */ jsxs2(Text2, { color: colors.error, children: [
        "Error: ",
        error
      ] })
    ] });
  }
  if (sessions.length === 0) {
    return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx2(Header, { compact: true, subtitle: "sessions" }),
      /* @__PURE__ */ jsxs2(Text2, { color: colors.warning, children: [
        "No sessions found. ",
        all ? "" : "Try --all to search all projects."
      ] })
    ] });
  }
  const columns = [
    { key: "id", label: "ID", width: 10 },
    { key: "project", label: "Project", width: 24 },
    { key: "modified", label: "Modified", width: 12 },
    { key: "name", label: "Name", width: 20 },
    { key: "preview", label: "First Message", width: 40 }
  ];
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx2(Header, { compact: true, subtitle: "sessions" }),
    /* @__PURE__ */ jsx2(Box2, { marginTop: 1, children: /* @__PURE__ */ jsxs2(Text2, { color: colors.dim, children: [
      all ? "All sessions" : `Sessions for ${process.cwd()}`,
      " (",
      sessions.length,
      sessions.length === limit ? "+" : "",
      ")"
    ] }) }),
    /* @__PURE__ */ jsx2(Box2, { marginTop: 1, children: /* @__PURE__ */ jsx2(Table, { columns, data: sessions, maxRows: limit }) })
  ] });
}
export {
  SessionsApp
};
//# sourceMappingURL=sessions-XYZGRXQM.js.map