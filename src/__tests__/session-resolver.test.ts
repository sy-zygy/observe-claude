import { describe, expect, it } from "vitest";
import { decodeProjectPath, encodeProjectPath } from "../core/session-resolver.js";

describe("encodeProjectPath", () => {
	it("encodes absolute paths by replacing non-alphanumeric chars with -", () => {
		expect(encodeProjectPath("/Users/foo/bar")).toBe("-Users-foo-bar");
	});

	it("encodes root path", () => {
		expect(encodeProjectPath("/")).toBe("-");
	});

	it("encodes nested paths", () => {
		expect(encodeProjectPath("/Users/gabriel/dev/my-project")).toBe(
			"-Users-gabriel-dev-my-project",
		);
	});

	it("encodes dots in path components", () => {
		expect(encodeProjectPath("/home/gabriel.guest/dev/project")).toBe(
			"-home-gabriel-guest-dev-project",
		);
	});

	it("encodes spaces and other special characters", () => {
		expect(encodeProjectPath("/home/user/my project/src")).toBe(
			"-home-user-my-project-src",
		);
	});

	it("truncates and hashes paths longer than 200 chars", () => {
		const longPath = "/home/user/" + "a".repeat(250);
		const encoded = encodeProjectPath(longPath);
		expect(encoded.length).toBeLessThanOrEqual(200 + 1 + 8); // truncated + dash + hash
		expect(encoded.length).toBeGreaterThan(200);
	});
});

describe("decodeProjectPath", () => {
	it("decodes by replacing - with /", () => {
		expect(decodeProjectPath("-Users-foo-bar")).toBe("/Users/foo/bar");
	});

	it("roundtrips for paths with only alphanumeric and slashes", () => {
		const original = "/Users/test/project";
		const encoded = encodeProjectPath(original);
		const decoded = decodeProjectPath(encoded);
		expect(decoded).toBe(original);
	});

	it("does NOT roundtrip for paths with dots (lossy encoding)", () => {
		const original = "/home/gabriel.guest/dev/project";
		const encoded = encodeProjectPath(original);
		const decoded = decodeProjectPath(encoded);
		// Dots become dashes during encoding, then slashes during decoding
		expect(decoded).not.toBe(original);
	});
});
