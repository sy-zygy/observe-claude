/** Represents encoded project path: /Users/foo/bar -> -Users-foo-bar */
export type EncodedPath = string;

/** UUID session identifier */
export type SessionId = string;

// --- JSONL Line Types ---

export type JsonlLineType =
	| "user"
	| "assistant"
	| "system"
	| "progress"
	| "summary"
	| "file-history-snapshot";

export interface TokenUsage {
	input_tokens: number;
	output_tokens: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
}

export interface TextContentBlock {
	type: "text";
	text: string;
}

export interface ToolUseContentBlock {
	type: "tool_use";
	id: string;
	name: string;
	input: Record<string, unknown>;
}

export interface ToolResultContentBlock {
	type: "tool_result";
	tool_use_id: string;
	content: string | Array<{ type: "text"; text: string }>;
	is_error?: boolean;
}

export interface ThinkingContentBlock {
	type: "thinking";
	thinking: string;
	signature: string;
}

export type ContentBlock =
	| TextContentBlock
	| ToolUseContentBlock
	| ToolResultContentBlock
	| ThinkingContentBlock;

export interface AssistantMessage {
	type: "assistant";
	message: {
		id: string;
		type: "message";
		role: "assistant";
		content: ContentBlock[];
		model: string;
		stop_reason: string | null;
		stop_sequence: string | null;
		usage: TokenUsage;
	};
	costUSD?: number;
	durationMs?: number;
}

export interface UserMessage {
	type: "user";
	message: {
		role: "user";
		content: string | ContentBlock[];
	};
}

export interface SystemMessage {
	type: "system";
	message: {
		role: "system";
		content: string;
	};
	/** Present when this is a compaction boundary */
	compact_boundary?: boolean;
}

export interface ProgressLine {
	type: "progress";
	message?: {
		id?: string;
		content?: ContentBlock[];
	};
}

export interface SummaryLine {
	type: "summary";
	summary?: string;
	costUSD?: number;
	usage?: TokenUsage;
}

export interface FileHistorySnapshot {
	type: "file-history-snapshot";
	files?: Record<string, unknown>;
}

export type JsonlLine =
	| AssistantMessage
	| UserMessage
	| SystemMessage
	| ProgressLine
	| SummaryLine
	| FileHistorySnapshot;

// --- Consolidated Message ---

export interface ConsolidatedAssistantMessage {
	id: string;
	model: string;
	content: ContentBlock[];
	usage: TokenUsage;
	stopReason: string | null;
	costUSD?: number;
	durationMs?: number;
}

// --- Session Types ---

export interface SessionIndexEntry {
	sessionId: string;
	name?: string;
	created?: string;
	modified?: string;
	lastCwd?: string;
}

export interface SessionsIndex {
	sessions: SessionIndexEntry[];
}

export interface SessionInfo {
	sessionId: string;
	projectPath: string;
	encodedPath: EncodedPath;
	jsonlPath: string;
	name?: string;
	created?: Date;
	modified?: Date;
	lastCwd?: string;
}

// --- Context Estimation ---

export interface ContextEstimate {
	currentTokens: number;
	maxTokens: number;
	percentUsed: number;
	compactionCount: number;
}

// --- Usage Aggregation ---

export interface UsageTotals {
	inputTokens: number;
	outputTokens: number;
	cacheCreationTokens: number;
	cacheReadTokens: number;
	totalCostUSD: number;
	messageCount: number;
	seenMessageIds: Set<string>;
}

// --- Hook Events ---

export interface HookEvent {
	timestamp: string;
	hookEventName: string;
	sessionId: string;
	toolName?: string;
	toolInput?: Record<string, unknown>;
}
