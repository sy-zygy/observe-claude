import { EventEmitter } from "node:events";

export interface FileWatcher extends EventEmitter {
	start(): Promise<void>;
	stop(): Promise<void>;
}

/**
 * Create a file watcher using chokidar.
 * Emits "change" events when the file is modified.
 */
export async function createFileWatcher(path: string): Promise<FileWatcher> {
	const emitter = new EventEmitter() as FileWatcher;
	let watcher: { close(): Promise<void> } | null = null;

	emitter.start = async () => {
		const { watch } = await import("chokidar");
		const w = watch(path, {
			persistent: true,
			usePolling: false,
			awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
		});

		w.on("change", () => emitter.emit("change"));
		w.on("add", () => emitter.emit("change"));
		w.on("unlink", () => emitter.emit("deleted"));

		watcher = w;
	};

	emitter.stop = async () => {
		if (watcher) {
			await watcher.close();
			watcher = null;
		}
		emitter.removeAllListeners();
	};

	return emitter;
}
