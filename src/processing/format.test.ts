import { describe, expect, test } from "bun:test";
import type { NormalisedEntry } from "../types.js";
import {
	formatDate,
	formatNumber,
	formatWordCount,
	normaliseWhitespace,
	renderEntriesTable,
	renderMetadataTable,
	truncateBody,
	truncateUrl,
	wordCountFooter,
} from "./format.js";

describe("formatNumber", () => {
	test("formats thousands", () => {
		expect(formatNumber(2400)).toBe("2,400");
	});

	test("small numbers unchanged", () => {
		expect(formatNumber(42)).toBe("42");
	});
});

describe("truncateUrl", () => {
	test("strips protocol and trailing slash", () => {
		expect(truncateUrl("https://example.com/post")).toBe("example.com/post");
	});

	test("truncates long urls", () => {
		const long = `https://example.com/${"a".repeat(100)}`;
		const result = truncateUrl(long, 40);
		expect(result.length).toBe(40);
		expect(result.endsWith("...")).toBe(true);
	});

	test("handles invalid urls gracefully", () => {
		expect(truncateUrl("not-a-url")).toBe("not-a-url");
	});
});

describe("formatDate", () => {
	test("formats date correctly", () => {
		const d = new Date("2026-03-21T19:15:00Z");
		const result = formatDate(d);
		expect(result).toBe("2026-03-21 19:15");
	});

	test("returns -- for null", () => {
		expect(formatDate(null)).toBe("--");
	});
});

describe("formatWordCount", () => {
	test("formats count", () => {
		expect(formatWordCount(2400)).toBe("2,400");
	});

	test("returns -- for null", () => {
		expect(formatWordCount(null)).toBe("--");
	});
});

describe("renderEntriesTable", () => {
	const entries: NormalisedEntry[] = [
		{
			title: "Post One",
			link: "https://example.com/one",
			date: new Date("2026-03-21T19:15:00Z"),
			author: "Alice",
			content: "some content",
			wordCount: 100,
			source: "Example Blog",
			feedUrl: "https://example.com/feed.xml",
		},
	];

	test("single source table omits Source column", () => {
		const result = renderEntriesTable({
			entries,
			multiSource: false,
		});
		expect(result).toContain("| # | Date | Title | URL | Words |");
		expect(result).not.toContain("Source");
		expect(result).toContain("Post One");
	});

	test("multi source table includes Source column", () => {
		const result = renderEntriesTable({
			entries,
			multiSource: true,
		});
		expect(result).toContain("| # | Date | Source | Title | URL | Words |");
		expect(result).toContain("Example Blog");
	});
});

describe("renderMetadataTable", () => {
	test("renders field/value pairs", () => {
		const result = renderMetadataTable([
			["Source", "Test Blog"],
			["Date", "2026-03-21"],
		]);
		expect(result).toContain("| Field | Value |");
		expect(result).toContain("| Source | Test Blog |");
		expect(result).toContain("| Date | 2026-03-21 |");
	});
});

describe("normaliseWhitespace", () => {
	test("collapses 3+ newlines to 2", () => {
		const input = "line1\n\n\n\nline2";
		expect(normaliseWhitespace(input)).toBe("line1\n\nline2");
	});

	test("trims whitespace", () => {
		expect(normaliseWhitespace("  hello  ")).toBe("hello");
	});
});

describe("truncateBody", () => {
	test("returns full text within limit", () => {
		expect(truncateBody("short", 100)).toBe("short");
	});

	test("truncates and adds ellipsis", () => {
		const result = truncateBody("a".repeat(100), 50);
		expect(result.length).toBe(53); // 50 + "..."
		expect(result.endsWith("...")).toBe(true);
	});

	test("-1 means no limit", () => {
		const long = "a".repeat(100000);
		expect(truncateBody(long, -1)).toBe(long);
	});

	test("0 returns empty", () => {
		expect(truncateBody("hello", 0)).toBe("");
	});
});

describe("wordCountFooter", () => {
	test("counts words and formats", () => {
		const result = wordCountFooter("feed content", "one two three four five");
		expect(result).toBe("[--- feed content, 5 words ---]");
	});

	test("strips HTML before counting", () => {
		const result = wordCountFooter(
			"full article",
			"<p>one two</p><p>three</p>",
		);
		expect(result).toBe("[--- full article, 3 words ---]");
	});
});
