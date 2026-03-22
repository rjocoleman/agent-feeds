import { extractArticle, htmlToMarkdown } from "../processing/extract.js";
import {
	normaliseWhitespace,
	renderMetadataTable,
	truncateBody,
	wordCountFooter,
} from "../processing/format.js";
import { parseFeed } from "../processing/parse.js";
import { generateSummary } from "../processing/summary.js";
import type { NormalisedEntry, ReaderConfig, Summariser } from "../types.js";
import { FeedError } from "../types.js";
import { discoverFeeds } from "./discover.js";

interface ValidatedGetInput {
	link: string;
	feed_url?: string;
	extract_full: boolean;
	max_body_chars: number;
	summary_first: boolean;
	summarise?: Summariser;
}

async function findEntryInFeed(
	feedUrl: string,
	link: string,
	config: ReaderConfig,
): Promise<NormalisedEntry | null> {
	const outcome = await parseFeed(feedUrl, config);
	if (!outcome.ok) return null;
	const normalise = (u: string) => {
		try {
			const parsed = new URL(u);
			return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
		} catch {
			return u.replace(/\/$/, "");
		}
	};
	return (
		outcome.feed.entries.find((e) => normalise(e.link) === normalise(link)) ??
		null
	);
}

async function findEntryViaDiscovery(
	link: string,
	config: ReaderConfig,
): Promise<{ entry: NormalisedEntry; feedUrl: string } | null> {
	const baseUrl = new URL(link).origin;

	const discovered = await discoverFeeds(baseUrl, config);
	const feedUrls = discovered.map((f) => f.url);

	for (const feedUrl of feedUrls) {
		const entry = await findEntryInFeed(feedUrl, link, config);
		if (entry) {
			return { entry, feedUrl };
		}
	}
	return null;
}

export async function get(
	input: ValidatedGetInput,
	config: ReaderConfig,
): Promise<string> {
	let entry: NormalisedEntry | null = null;
	let feedUrl: string | undefined = input.feed_url;

	// Try to find the entry in a feed
	if (feedUrl) {
		entry = await findEntryInFeed(feedUrl, input.link, config);
	} else {
		const found = await findEntryViaDiscovery(input.link, config);
		if (found) {
			entry = found.entry;
			feedUrl = found.feedUrl;
		}
	}

	// If no entry found, fall back to direct extraction
	if (!entry) {
		return getViaExtraction(input, config);
	}

	// Build output
	let body: string;
	let contentType: "feed content" | "full article";

	if (input.extract_full) {
		try {
			const article = await extractArticle(input.link, config);
			body = article.content;
			contentType = "full article";
		} catch {
			// Fall back to feed content
			body = entry.content ? htmlToMarkdown(entry.content) : "";
			contentType = "feed content";
		}
	} else {
		body = entry.content ? htmlToMarkdown(entry.content) : "";
		contentType = "feed content";
	}

	body = normaliseWhitespace(body);

	const lines: string[] = [`# ${entry.title}`];

	// Summary
	if (input.summary_first && body) {
		const summary = await generateSummary(body, input.summarise, config);
		if (summary) {
			lines.push("");
			lines.push(`> **Summary:** ${summary}`);
		}
	}

	// Metadata
	const fields: [string, string][] = [
		["Source", entry.source],
		[
			"Date",
			entry.date
				? entry.date.toISOString().replace("T", " ").slice(0, 16)
				: "--",
		],
		["Author", entry.author ?? "--"],
		["URL", input.link],
	];
	if (feedUrl) {
		fields.push(["Feed", feedUrl]);
	}
	if (input.extract_full && contentType === "full article") {
		fields.push(["Content", "Full article extracted from URL"]);
	}

	lines.push("");
	lines.push(renderMetadataTable(fields));
	lines.push("");
	lines.push("---");

	// Body
	if (input.max_body_chars !== 0 && body) {
		const truncated = truncateBody(body, input.max_body_chars);
		lines.push("");
		lines.push(truncated);
		lines.push("");
		lines.push(wordCountFooter(contentType, body));
	}

	return lines.join("\n");
}

async function getViaExtraction(
	input: ValidatedGetInput,
	config: ReaderConfig,
): Promise<string> {
	try {
		const article = await extractArticle(input.link, config);
		const body = normaliseWhitespace(article.content);

		const lines: string[] = [`# ${article.title ?? "Extracted Article"}`];

		if (input.summary_first && body) {
			const summary = await generateSummary(body, input.summarise, config);
			if (summary) {
				lines.push("");
				lines.push(`> **Summary:** ${summary}`);
			}
		}

		const fields: [string, string][] = [
			["URL", input.link],
			["Content", "Direct extraction (entry not found in feed)"],
		];
		if (article.date) {
			fields.splice(1, 0, ["Date", article.date]);
		}
		if (article.author) {
			fields.splice(1, 0, ["Author", article.author]);
		}

		lines.push("");
		lines.push(renderMetadataTable(fields));
		lines.push("");
		lines.push("---");

		if (input.max_body_chars !== 0 && body) {
			const truncated = truncateBody(body, input.max_body_chars);
			lines.push("");
			lines.push(truncated);
			lines.push("");
			lines.push(wordCountFooter("direct extraction", body));
		}

		return lines.join("\n");
	} catch (err) {
		if (err instanceof FeedError) {
			const lines = [
				"# Could not extract article",
				"",
				renderMetadataTable([
					["URL", input.link],
					["Error", err.message],
				]),
			];
			return lines.join("\n");
		}
		throw err;
	}
}
