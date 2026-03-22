import { parseFeedString } from "../processing/parse.js";
import type { ReaderConfig } from "../types.js";

interface ValidatedDiscoverInput {
	url: string;
}

export interface DiscoveredFeed {
	format: string;
	url: string;
}

const COMMON_PATHS = [
	"/feed",
	"/feed.xml",
	"/rss",
	"/rss.xml",
	"/atom.xml",
	"/feed/json",
	"/.rss",
];

const FEED_TYPES: Record<string, string> = {
	"application/rss+xml": "RSS",
	"application/atom+xml": "Atom",
	"application/feed+json": "JSON Feed",
	"application/json": "JSON Feed",
};

function extractFeedLinks(html: string, baseUrl: string): DiscoveredFeed[] {
	const feeds: DiscoveredFeed[] = [];
	const linkRegex = /<link[^>]*rel=["']alternate["'][^>]*>/gi;

	for (const match of html.matchAll(linkRegex)) {
		const tag = match[0];
		const typeMatch = tag.match(/type=["']([^"']+)["']/i);
		const hrefMatch = tag.match(/href=["']([^"']+)["']/i);

		if (!typeMatch || !hrefMatch) continue;

		const format = FEED_TYPES[typeMatch[1]];
		if (!format) continue;

		let href = hrefMatch[1];
		if (href.startsWith("/")) {
			href = new URL(href, baseUrl).toString();
		} else if (!href.startsWith("http")) {
			href = new URL(href, baseUrl).toString();
		}

		feeds.push({ format, url: href });
	}

	return feeds;
}

function detectFormat(content: string): string {
	const trimmed = content.trimStart();
	if (trimmed.startsWith("{")) return "JSON Feed";
	if (
		trimmed.includes("<feed") ||
		trimmed.includes('xmlns="http://www.w3.org/2005/Atom"')
	)
		return "Atom";
	return "RSS";
}

async function fetchAndValidate(
	url: string,
	config: ReaderConfig,
): Promise<{ valid: boolean; format: string }> {
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

		if (!response.ok) return { valid: false, format: "RSS" };

		const text = await response.text();

		try {
			await parseFeedString(text, url);
		} catch {
			return { valid: false, format: "RSS" };
		}

		return { valid: true, format: detectFormat(text) };
	} catch {
		return { valid: false, format: "RSS" };
	}
}

export async function discoverFeeds(
	url: string,
	config: ReaderConfig,
): Promise<DiscoveredFeed[]> {
	const userAgent = config.userAgent ?? "agent-feeds/1.0";
	const timeout = config.timeouts?.fetch ?? 10_000;

	const discovered: DiscoveredFeed[] = [];

	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			headers: { "User-Agent": userAgent },
			signal: controller.signal,
		});
		clearTimeout(timer);

		if (response.ok) {
			const body = await response.text();

			// Check if the URL itself is a feed
			try {
				await parseFeedString(body, url);
				return [{ format: detectFormat(body), url }];
			} catch {
				// Not a feed, look for <link> tags in the HTML
				const links = extractFeedLinks(body, url);
				discovered.push(...links);
			}
		}
	} catch {
		// Page fetch failed, continue with fallback paths
	}

	if (discovered.length === 0) {
		const origin = new URL(url).origin;

		const checks = await Promise.all(
			COMMON_PATHS.map(async (path) => {
				const feedUrl = `${origin}${path}`;
				const result = await fetchAndValidate(feedUrl, config);
				return { url: feedUrl, ...result };
			}),
		);

		for (const check of checks) {
			if (check.valid) {
				discovered.push({ format: check.format, url: check.url });
			}
		}
	} else {
		const validated = await Promise.all(
			discovered.map(async (feed) => {
				const result = await fetchAndValidate(feed.url, config);
				return { ...feed, valid: result.valid };
			}),
		);
		discovered.length = 0;
		for (const feed of validated) {
			if (feed.valid) {
				discovered.push({ format: feed.format, url: feed.url });
			}
		}
	}

	return discovered;
}

export async function discover(
	input: ValidatedDiscoverInput,
	config: ReaderConfig,
): Promise<string> {
	let hostname: string;
	try {
		hostname = new URL(input.url).hostname;
	} catch {
		hostname = input.url;
	}

	const discovered = await discoverFeeds(input.url, config);

	const lines: string[] = [`# Feeds Found: ${hostname}`, ""];

	if (discovered.length === 0) {
		lines.push("No RSS, Atom, or JSON Feed links discovered.");
	} else {
		lines.push("| Format | URL |");
		lines.push("|--------|-----|");
		for (const feed of discovered) {
			lines.push(`| ${feed.format} | ${feed.url} |`);
		}
	}

	return lines.join("\n");
}
