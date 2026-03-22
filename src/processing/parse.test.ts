import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFeedString } from "./parse.js";

const fixturesDir = join(import.meta.dir, "../fixtures");

describe("parseFeedString", () => {
	test("parses RSS 2.0 feed", async () => {
		const xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");
		const feed = await parseFeedString(
			xml,
			"https://test.example.com/feed.xml",
		);

		expect(feed.title).toBe("Test Blog");
		expect(feed.entries).toHaveLength(3);

		const first = feed.entries[0];
		expect(first.title).toBe("First Post");
		expect(first.link).toBe("https://test.example.com/first-post");
		expect(first.author).toBe("Alice");
		expect(first.content).toContain("first post content");
		expect(first.wordCount).toBeGreaterThan(0);
		expect(first.date).toBeInstanceOf(Date);
	});

	test("parses Atom feed", async () => {
		const xml = readFileSync(join(fixturesDir, "atom.xml"), "utf-8");
		const feed = await parseFeedString(
			xml,
			"https://atom.example.com/atom.xml",
		);

		expect(feed.title).toBe("Atom Test Feed");
		expect(feed.entries).toHaveLength(2);

		const first = feed.entries[0];
		expect(first.title).toBe("Atom Entry One");
		expect(first.link).toBe("https://atom.example.com/entry-one");
		expect(first.content).toContain("bold");
	});

	test("parses JSON Feed", async () => {
		const json = readFileSync(join(fixturesDir, "jsonfeed.json"), "utf-8");
		const feed = await parseFeedString(
			json,
			"https://json.example.com/feed.json",
		);

		expect(feed.title).toBe("JSON Feed Test");
		expect(feed.entries).toHaveLength(1);

		const first = feed.entries[0];
		expect(first.title).toBe("JSON Entry");
		expect(first.link).toBe("https://json.example.com/json-entry");
		expect(first.author).toBe("Eve");
		expect(first.content).toContain("JSON Feed content");
		expect(first.date).toBeInstanceOf(Date);
	});

	test("throws PARSE_FAILED for invalid content", async () => {
		await expect(
			parseFeedString("not xml at all", "https://bad.example.com/feed"),
		).rejects.toThrow("Failed to parse feed");
	});

	test("uses hostname as title fallback", async () => {
		const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item><title>Test</title><link>https://x.com/t</link></item>
  </channel>
</rss>`;
		const feed = await parseFeedString(xml, "https://notitle.example.com/feed");
		expect(feed.title).toBe("notitle.example.com");
	});

	test("handles entry without content", async () => {
		const xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");
		const feed = await parseFeedString(
			xml,
			"https://test.example.com/feed.xml",
		);
		const third = feed.entries[2];
		expect(third.content).toContain("short description");
	});
});
