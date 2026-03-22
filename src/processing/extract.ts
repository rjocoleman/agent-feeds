import { extract } from "@extractus/article-extractor";
import TurndownService from "turndown";
import type { ReaderConfig } from "../types.js";
import { FeedError } from "../types.js";

const turndown = new TurndownService({
	headingStyle: "atx",
	codeBlockStyle: "fenced",
});

export interface ExtractedArticle {
	title: string | null;
	content: string;
	author: string | null;
	date: string | null;
	url: string;
}

export async function extractArticle(
	url: string,
	config: ReaderConfig,
): Promise<ExtractedArticle> {
	const timeout = config.timeouts?.article ?? 15_000;

	try {
		const article = await extract(
			url,
			{},
			{
				signal: AbortSignal.timeout(timeout),
			},
		);

		if (!article || !article.content) {
			throw new FeedError(
				"EXTRACTION_FAILED",
				"Extraction returned no content (possible paywall or JS-rendered page)",
			);
		}

		const markdown = turndown.turndown(article.content);

		return {
			title: article.title ?? null,
			content: markdown,
			author: article.author ?? null,
			date: article.published ?? null,
			url,
		};
	} catch (err) {
		if (err instanceof FeedError) throw err;
		if (err instanceof DOMException && err.name === "TimeoutError") {
			throw new FeedError("TIMEOUT", `Article extraction timed out for ${url}`);
		}
		const message = err instanceof Error ? err.message : String(err);
		throw new FeedError("EXTRACTION_FAILED", message);
	}
}

export function htmlToMarkdown(html: string): string {
	return turndown.turndown(html);
}
