import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createReader, FeedError } from "./index.js";
import { mockFetch, restoreFetch } from "./testing/mock-fetch.js";

const fixturesDir = join(import.meta.dir, "fixtures");
const rss2Xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");

afterAll(() => {
	restoreFetch();
});

describe("createReader", () => {
	test("returns reader with all methods", () => {
		const rss = createReader();
		expect(typeof rss.entries).toBe("function");
		expect(typeof rss.recent).toBe("function");
		expect(typeof rss.get).toBe("function");
		expect(typeof rss.article).toBe("function");
		expect(typeof rss.discover).toBe("function");
	});
});

describe("reader.entries", () => {
	test("validates input and returns markdown", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const rss = createReader();
		const result = await rss.entries({
			urls: ["https://test.example.com/feed.xml"],
		});

		expect(result).toContain("# Entries");
		expect(result).toContain("First Post");
	});

	test("rejects invalid input", async () => {
		const rss = createReader();
		await expect(rss.entries({ urls: [] })).rejects.toThrow(FeedError);
	});
});

describe("reader.recent", () => {
	test("returns same format as entries", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const rss = createReader();
		const result = await rss.recent(["https://test.example.com/feed.xml"]);

		expect(result).toContain("# Entries");
		expect(result).toContain("First Post");
	});

	test("respects limit", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const rss = createReader();
		const result = await rss.recent(["https://test.example.com/feed.xml"], 1);

		expect(result).toContain("1 entries from 1 feed");
	});

	test("rejects empty urls", async () => {
		const rss = createReader();
		await expect(rss.recent([])).rejects.toThrow(FeedError);
	});
});

describe("reader.discover", () => {
	test("validates input", async () => {
		const rss = createReader();
		await expect(rss.discover({ url: "not-a-url" })).rejects.toThrow(FeedError);
	});
});

describe("reader with config", () => {
	test("passes config to tools", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const rss = createReader({
			userAgent: "test-agent/1.0",
			timeouts: { fetch: 5000 },
		});

		const result = await rss.entries({
			urls: ["https://test.example.com/feed.xml"],
		});

		expect(result).toContain("# Entries");
	});
});
