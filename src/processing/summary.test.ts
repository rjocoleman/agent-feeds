import { describe, expect, test } from "bun:test";
import { generateSummary } from "./summary.js";

describe("generateSummary", () => {
	test("uses per-call summariser when provided", async () => {
		const perCall = async (body: string) => `Summary: ${body.slice(0, 10)}`;
		const result = await generateSummary("Hello world content here", perCall);
		expect(result).toBe("Summary: Hello worl");
	});

	test("uses config summariser as fallback", async () => {
		const config = {
			summarise: async (body: string) => `Config: ${body.slice(0, 5)}`,
		};
		const result = await generateSummary("Hello world", undefined, config);
		expect(result).toBe("Config: Hello");
	});

	test("per-call overrides config", async () => {
		const perCall = async () => "per-call";
		const config = { summarise: async () => "config" };
		const result = await generateSummary("body", perCall, config);
		expect(result).toBe("per-call");
	});

	test("deterministic fallback uses first paragraph", async () => {
		const body = "First paragraph here.\n\nSecond paragraph.";
		const result = await generateSummary(body);
		expect(result).toBe("First paragraph here.");
	});

	test("deterministic fallback truncates at 300 chars", async () => {
		const long = "a".repeat(400);
		const result = await generateSummary(long);
		expect(result.length).toBe(300);
		expect(result.endsWith("...")).toBe(true);
	});

	test("returns empty string for empty body", async () => {
		const result = await generateSummary("");
		expect(result).toBe("");
	});
});
