import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mockFetch, restoreFetch } from "../testing/mock-fetch.js";
import { discover } from "./discover.js";

const fixturesDir = join(import.meta.dir, "../fixtures");
const pageHtml = readFileSync(
	join(fixturesDir, "page-with-feeds.html"),
	"utf-8",
);
const rss2Xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");

afterAll(() => {
	restoreFetch();
});

describe("discover", () => {
	test("finds feeds from link tags", async () => {
		mockFetch({
			"https://test.example.com": { ok: true, text: pageHtml },
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
			"https://test.example.com/atom.xml": { ok: true, text: rss2Xml },
		});

		const result = await discover({ url: "https://test.example.com" }, {});

		expect(result).toContain("# Feeds Found: test.example.com");
		expect(result).toContain("| Format | URL |");
		expect(result).toContain("RSS");
	});

	test("reports no feeds found", async () => {
		mockFetch({
			"https://nofeed.example.com": {
				ok: true,
				text: "<html><head></head><body>No feeds</body></html>",
			},
		});

		const result = await discover({ url: "https://nofeed.example.com" }, {});

		expect(result).toContain("# Feeds Found: nofeed.example.com");
		expect(result).toContain("No RSS, Atom, or JSON Feed links discovered.");
	});

	test("falls back to common paths when no link tags", async () => {
		mockFetch({
			"https://fallback.example.com": {
				ok: true,
				text: "<html><head></head><body></body></html>",
			},
			"https://fallback.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await discover({ url: "https://fallback.example.com" }, {});

		expect(result).toContain("# Feeds Found: fallback.example.com");
		expect(result).toContain("https://fallback.example.com/feed.xml");
	});
});
