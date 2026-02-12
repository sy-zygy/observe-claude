import { describe, expect, it } from "vitest";
import { decodeProjectPath, encodeProjectPath } from "../core/session-resolver.js";

describe("encodeProjectPath", () => {
	it("encodes absolute paths by replacing / with -", () => {
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
});

describe("decodeProjectPath", () => {
	it("decodes by replacing - with /", () => {
		expect(decodeProjectPath("-Users-foo-bar")).toBe("/Users/foo/bar");
	});

	it("roundtrips with encode", () => {
		const original = "/Users/test/project";
		const encoded = encodeProjectPath(original);
		const decoded = decodeProjectPath(encoded);
		expect(decoded).toBe(original);
	});
});
