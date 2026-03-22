import RssParser from "rss-parser";
import type {
	FeedFailure,
	FeedOutcome,
	FeedResult,
	NormalisedEntry,
	ParsedFeed,
	ReaderConfig,
} from "../types.js";
import { FeedError } from "../types.js";

const parser = new RssParser();

function countWords(text: string): number {
	const stripped = text.replace(/<[^>]*>/g, " ");
	const words = stripped.split(/\s+/).filter((w) => w.length > 0);
	return words.length;
}

function normaliseEntry(
	item: RssParser.Item & Record<string, unknown>,
	feedTitle: string,
	feedUrl: string,
): NormalisedEntry {
	const contentEncoded = item["content:encoded"] as string | undefined;
	const content =
		contentEncoded ??
		item.content ??
		item.summary ??
		item.contentSnippet ??
		null;
	return {
		title: item.title ?? "(untitled)",
		link: item.link ?? "",
		date: item.isoDate ? new Date(item.isoDate) : null,
		author: item.creator ?? null,
		content,
		wordCount: content ? countWords(content) : null,
		source: feedTitle || new URL(feedUrl).hostname,
		feedUrl,
	};
}

// JSON Feed types (jsonfeed.org/version/1.1)
interface JsonFeedAuthor {
	name?: string;
	url?: string;
}

interface JsonFeedItem {
	id: string;
	title?: string;
	url?: string;
	content_html?: string;
	content_text?: string;
	summary?: string;
	date_published?: string;
	date_modified?: string;
	authors?: JsonFeedAuthor[];
	author?: JsonFeedAuthor;
}

interface JsonFeed {
	version: string;
	title?: string;
	home_page_url?: string;
	feed_url?: string;
	items: JsonFeedItem[];
}

function isJsonFeed(text: string): boolean {
	const trimmed = text.trimStart();
	if (!trimmed.startsWith("{")) return false;
	try {
		const parsed = JSON.parse(trimmed);
		return (
			typeof parsed.version === "string" &&
			parsed.version.includes("jsonfeed.org")
		);
	} catch {
		return false;
	}
}

function parseJsonFeed(text: string, feedUrl: string): ParsedFeed {
	const feed: JsonFeed = JSON.parse(text);
	const feedTitle = feed.title ?? new URL(feedUrl).hostname;

	const entries: NormalisedEntry[] = feed.items.map((item) => {
		const content =
			item.content_html ?? item.content_text ?? item.summary ?? null;
		const author = item.authors?.[0]?.name ?? item.author?.name ?? null;

		return {
			title: item.title ?? "(untitled)",
			link: item.url ?? "",
			date: item.date_published ? new Date(item.date_published) : null,
			author,
			content,
			wordCount: content ? countWords(content) : null,
			source: feedTitle,
			feedUrl,
		};
	});

	return { title: feedTitle, entries, feedUrl };
}

export async function parseFeed(
	url: string,
	config: ReaderConfig,
): Promise<FeedOutcome> {
	const timeout = config.timeouts?.fetch ?? 10_000;
	const userAgent = config.userAgent ?? "agent-feeds/1.0";

	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			headers: { "User-Agent": userAgent },
			signal: controller.signal,
		});
		clearTimeout(timer);

		if (!response.ok) {
			return {
				ok: false,
				url,
				error: `HTTP ${response.status}`,
			} satisfies FeedFailure;
		}

		const text = await response.text();

		const parsed = isJsonFeed(text)
			? parseJsonFeed(text, url)
			: await parseXmlFeed(text, url);

		return {
			ok: true,
			feed: parsed,
		} satisfies FeedResult;
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return {
				ok: false,
				url,
				error: "connection timeout",
			} satisfies FeedFailure;
		}
		return {
			ok: false,
			url,
			error: "failed to parse feed content",
		} satisfies FeedFailure;
	}
}

async function parseXmlFeed(xml: string, feedUrl: string): Promise<ParsedFeed> {
	const feed = await parser.parseString(xml);
	return {
		title: feed.title ?? new URL(feedUrl).hostname,
		entries: feed.items.map((item) =>
			normaliseEntry(item, feed.title ?? "", feedUrl),
		),
		feedUrl,
	};
}

export async function parseFeedString(
	text: string,
	feedUrl: string,
): Promise<ParsedFeed> {
	try {
		if (isJsonFeed(text)) {
			return parseJsonFeed(text, feedUrl);
		}
		return await parseXmlFeed(text, feedUrl);
	} catch {
		throw new FeedError("PARSE_FAILED", `Failed to parse feed from ${feedUrl}`);
	}
}
