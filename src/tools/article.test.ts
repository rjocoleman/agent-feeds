import { afterAll, describe, expect, test } from "bun:test";
import { restoreFetch } from "../testing/mock-fetch.js";
import { article } from "./article.js";

afterAll(() => {
	restoreFetch();
});

describe("article", () => {
	test("extracts and formats article", async () => {
		const result = await article(
			{
				url: "https://nonexistent.example.com/article",
				max_body_chars: 12000,
				summary_first: false,
			},
			{ timeouts: { article: 2000 } },
		);

		expect(result).toContain("# Could not extract article");
		expect(result).toContain("https://nonexistent.example.com/article");
	});

	test("renders error output with metadata table", async () => {
		const result = await article(
			{
				url: "https://fail.example.com/post",
				max_body_chars: 12000,
				summary_first: false,
			},
			{ timeouts: { article: 2000 } },
		);

		expect(result).toContain("| Field | Value |");
		expect(result).toContain("| URL | https://fail.example.com/post |");
		expect(result).toContain("| Error |");
	});
});
