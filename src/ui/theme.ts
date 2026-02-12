/** Retro warez/BBS/demoscene color palette */
export const colors = {
	primary: "#00FF41", // Matrix green
	secondary: "#00BFFF", // Electric cyan
	accent: "#FF6600", // Orange
	warning: "#FFD700", // Gold
	error: "#FF0040", // Hot red
	dim: "#666666", // Dimmed text
	bg: "#000000", // Background
	text: "#CCCCCC", // Default text
	bright: "#FFFFFF", // Bright white
} as const;

/** Double-line box-drawing characters */
export const borders = {
	topLeft: "╔",
	topRight: "╗",
	bottomLeft: "╚",
	bottomRight: "╝",
	horizontal: "═",
	vertical: "║",
	teeLeft: "╠",
	teeRight: "╣",
	teeTop: "╦",
	teeBottom: "╩",
	cross: "╬",
} as const;

/** Single-line box-drawing for lighter sections */
export const lightBorders = {
	topLeft: "┌",
	topRight: "┐",
	bottomLeft: "└",
	bottomRight: "┘",
	horizontal: "─",
	vertical: "│",
	teeLeft: "├",
	teeRight: "┤",
} as const;

/** Progress bar characters (ordered from full to empty) */
export const progressChars = {
	full: "█",
	threequarter: "▓",
	half: "▒",
	quarter: "░",
	empty: " ",
} as const;

/** Shade/decoration characters */
export const shades = {
	light: "░",
	medium: "▒",
	dark: "▓",
	full: "█",
} as const;

/** Build a horizontal box-drawing line */
export function hLine(width: number, char = borders.horizontal): string {
	return char.repeat(width);
}

/** Build a box-drawing top border */
export function topBorder(width: number): string {
	return `${borders.topLeft}${hLine(width - 2)}${borders.topRight}`;
}

/** Build a box-drawing bottom border */
export function bottomBorder(width: number): string {
	return `${borders.bottomLeft}${hLine(width - 2)}${borders.bottomRight}`;
}

/** Build a separator line */
export function separatorLine(width: number): string {
	return `${borders.teeLeft}${hLine(width - 2)}${borders.teeRight}`;
}

/** Pad text to fit within a box line */
export function boxLine(text: string, width: number): string {
	const content = text.slice(0, width - 4);
	const padding = " ".repeat(Math.max(0, width - 4 - stripAnsi(content).length));
	return `${borders.vertical} ${content}${padding} ${borders.vertical}`;
}

/** Strip ANSI escape codes for length calculation */
function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Format a timestamp for display */
export function formatTimestamp(date: Date): string {
	return date.toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

/** Format a relative time (e.g. "3m ago") */
export function formatRelativeTime(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

/** Format token count with K/M suffixes */
export function formatTokens(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
	return String(count);
}

/** Format USD cost */
export function formatCost(usd: number): string {
	if (usd < 0.01) return `$${usd.toFixed(4)}`;
	return `$${usd.toFixed(2)}`;
}
