import { removeHooks } from "../core/hooks-manager.js";

export async function teardown(): Promise<void> {
	try {
		const result = await removeHooks();
		if (result.removed) {
			console.log("✓ observe-claude hooks removed from global settings.");
			console.log(`  Settings: ${result.settingsPath}`);
		} else {
			console.log("No observe-claude hooks found in global settings.");
			console.log(`  Checked: ${result.settingsPath}`);
		}
	} catch (err) {
		console.error("Failed to remove hooks:", err instanceof Error ? err.message : err);
		process.exit(1);
	}
}
