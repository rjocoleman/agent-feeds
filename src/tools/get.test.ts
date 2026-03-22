import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mockFetch, restoreFetch } from "../testing/mock-fetch.js";
import { get } from "./get.js";

const fixturesDir = join(import.meta.dir, "../fixtures");
const rss2Xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");

afterAll(() => {
	restoreFetch();
});

describe("get", () => {
	test("fetches entry from feed by link (fast path)", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/first-post",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 8000,
				summary_first: false,
			},
			{},
		);

		expect(result).toContain("# First Post");
		expect(result).toContain("| Source | Test Blog |");
		expect(result).toContain("| Author | Alice |");
		expect(result).toContain("| URL | https://test.example.com/first-post |");
		expect(result).toContain("| Feed | https://test.example.com/feed.xml |");
		expect(result).toContain("first post content");
		expect(result).toContain("[--- feed content,");
	});

	test("returns entry with body omitted when max_body_chars is 0", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/first-post",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 0,
				summary_first: false,
			},
			{},
		);

		expect(result).toContain("# First Post");
		expect(result).not.toContain("first post content");
		expect(result).not.toContain("[--- feed content,");
	});

	test("generates summary when summary_first is true", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/first-post",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 8000,
				summary_first: true,
			},
			{},
		);

		expect(result).toContain("# First Post");
		expect(result).toContain("> **Summary:**");
	});

	test("uses custom summariser", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/first-post",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 8000,
				summary_first: true,
				summarise: async () => "Custom summary output",
			},
			{},
		);

		expect(result).toContain("> **Summary:** Custom summary output");
	});

	test("entry not found in feed falls back to extraction", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/nonexistent",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 8000,
				summary_first: false,
			},
			{ timeouts: { article: 2000 } },
		);

		expect(result).toContain("# Could not extract article");
		expect(result).toContain("https://test.example.com/nonexistent");
	});

	test("handles entry with no content gracefully", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await get(
			{
				link: "https://test.example.com/third-post",
				feed_url: "https://test.example.com/feed.xml",
				extract_full: false,
				max_body_chars: 8000,
				summary_first: false,
			},
			{},
		);

		expect(result).toContain("# Third Post");
		expect(result).toContain("| Field | Value |");
	});
});
