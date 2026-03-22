import { describe, expect, test } from "bun:test";
import {
	ArticleInputSchema,
	DiscoverInputSchema,
	EntriesInputSchema,
	GetInputSchema,
} from "./schemas.js";
import { FeedError } from "./types.js";

describe("EntriesInputSchema", () => {
	test("accepts valid input with defaults", () => {
		const result = EntriesInputSchema.safeParse({
			urls: ["https://example.com/feed.xml"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(20);
			expect(result.data.verbose).toBe(false);
		}
	});

	test("accepts full input", () => {
		const result = EntriesInputSchema.safeParse({
			urls: ["https://example.com/feed.xml", "https://other.com/rss"],
			limit: 50,
			since: "2026-03-20T00:00:00Z",
			before: "2026-03-22T00:00:00Z",
			verbose: true,
		});
		expect(result.success).toBe(true);
	});

	test("rejects empty urls array", () => {
		const result = EntriesInputSchema.safeParse({ urls: [] });
		expect(result.success).toBe(false);
	});

	test("rejects invalid url", () => {
		const result = EntriesInputSchema.safeParse({ urls: ["not-a-url"] });
		expect(result.success).toBe(false);
	});

	test("rejects limit over 100", () => {
		const result = EntriesInputSchema.safeParse({
			urls: ["https://example.com/feed.xml"],
			limit: 101,
		});
		expect(result.success).toBe(false);
	});

	test("rejects limit of 0", () => {
		const result = EntriesInputSchema.safeParse({
			urls: ["https://example.com/feed.xml"],
			limit: 0,
		});
		expect(result.success).toBe(false);
	});
});

describe("GetInputSchema", () => {
	test("accepts valid input with defaults", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.extract_full).toBe(false);
			expect(result.data.max_body_chars).toBe(8000);
			expect(result.data.summary_first).toBe(false);
		}
	});

	test("accepts feed_url", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
			feed_url: "https://example.com/feed.xml",
		});
		expect(result.success).toBe(true);
	});

	test("accepts summarise function", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
			summarise: async (body: string) => body.slice(0, 100),
		});
		expect(result.success).toBe(true);
	});

	test("accepts max_body_chars of -1 (no limit)", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
			max_body_chars: -1,
		});
		expect(result.success).toBe(true);
	});

	test("accepts max_body_chars of 0 (omit body)", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
			max_body_chars: 0,
		});
		expect(result.success).toBe(true);
	});

	test("rejects max_body_chars below -1", () => {
		const result = GetInputSchema.safeParse({
			link: "https://example.com/post",
			max_body_chars: -2,
		});
		expect(result.success).toBe(false);
	});
});

describe("ArticleInputSchema", () => {
	test("accepts valid input with defaults", () => {
		const result = ArticleInputSchema.safeParse({
			url: "https://example.com/article",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.max_body_chars).toBe(12000);
		}
	});

	test("rejects invalid url", () => {
		const result = ArticleInputSchema.safeParse({ url: "not-a-url" });
		expect(result.success).toBe(false);
	});
});

describe("DiscoverInputSchema", () => {
	test("accepts valid url", () => {
		const result = DiscoverInputSchema.safeParse({
			url: "https://example.com",
		});
		expect(result.success).toBe(true);
	});

	test("rejects invalid url", () => {
		const result = DiscoverInputSchema.safeParse({ url: "nope" });
		expect(result.success).toBe(false);
	});
});

describe("FeedError", () => {
	test("has correct name and code", () => {
		const err = new FeedError("FETCH_FAILED", "connection timeout");
		expect(err.name).toBe("FeedError");
		expect(err.code).toBe("FETCH_FAILED");
		expect(err.message).toBe("connection timeout");
		expect(err).toBeInstanceOf(Error);
	});
});
