import { Box, Text } from "ink";
import { borders, colors } from "./theme.js";

interface Column {
	key: string;
	label: string;
	width?: number;
	color?: string;
	align?: "left" | "right";
}

interface TableProps {
	columns: Column[];
	data: Record<string, string>[];
	maxRows?: number;
}

function pad(text: string, width: number, align: "left" | "right" = "left"): string {
	const truncated = text.length > width ? `${text.slice(0, width - 1)}…` : text;
	const padding = width - truncated.length;
	if (align === "right") {
		return " ".repeat(padding) + truncated;
	}
	return truncated + " ".repeat(padding);
}

export function Table({ columns, data, maxRows }: TableProps) {
	const rows = maxRows ? data.slice(0, maxRows) : data;

	// Calculate column widths
	const colWidths = columns.map((col) => {
		const headerWidth = col.label.length;
		const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[col.key] ?? "").length), 0);
		return col.width ?? Math.min(Math.max(headerWidth, maxDataWidth) + 2, 40);
	});

	const _totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + columns.length + 1;

	// Top border
	const topLine =
		borders.topLeft +
		colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.teeTop) +
		borders.topRight;

	// Header
	const headerLine =
		borders.vertical +
		columns.map((col, i) => pad(col.label, colWidths[i])).join(borders.vertical) +
		borders.vertical;

	// Separator
	const sepLine =
		borders.teeLeft +
		colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.cross) +
		borders.teeRight;

	// Bottom border
	const bottomLine =
		borders.bottomLeft +
		colWidths.map((w) => borders.horizontal.repeat(w)).join(borders.teeBottom) +
		borders.bottomRight;

	return (
		<Box flexDirection="column">
			<Text color={colors.secondary}>{topLine}</Text>
			<Text color={colors.primary} bold>
				{headerLine}
			</Text>
			<Text color={colors.secondary}>{sepLine}</Text>
			{rows.map((row, rowIdx) => {
				const line =
					borders.vertical +
					columns
						.map((col, i) => pad(row[col.key] ?? "", colWidths[i], col.align))
						.join(borders.vertical) +
					borders.vertical;
				return (
					<Text key={rowIdx} color={rowIdx === 0 ? colors.accent : colors.text}>
						{line}
					</Text>
				);
			})}
			<Text color={colors.secondary}>{bottomLine}</Text>
			{maxRows && data.length > maxRows && (
				<Text color={colors.dim}>{` … and ${data.length - maxRows} more sessions`}</Text>
			)}
		</Box>
	);
}
