import {
	ArticleInputSchema,
	DiscoverInputSchema,
	EntriesInputSchema,
	GetInputSchema,
} from "./schemas.js";
import { article as articleTool } from "./tools/article.js";
import { discover as discoverTool } from "./tools/discover.js";
import { entries as entriesTool } from "./tools/entries.js";
import { get as getTool } from "./tools/get.js";
import { recent as recentTool } from "./tools/recent.js";
import type {
	ArticleInput,
	DiscoverInput,
	EntriesInput,
	GetInput,
	ReaderConfig,
} from "./types.js";
import { FeedError } from "./types.js";

/**
 * Stateless RSS/Atom/JSON Feed reader. Each method is an independent
 * HTTP fetch that returns markdown. Created via {@link createReader}.
 */
export class AgentRssReader {
	private config: ReaderConfig;

	/** @param config - Reader configuration (timeouts, user agent, summariser). */
	constructor(config: ReaderConfig = {}) {
		this.config = config;
	}

	/**
	 * Fetch and list entries from one or more feed URLs.
	 * Returns a markdown table sorted by date descending.
	 *
	 * @param input - Feed URLs, limit, date filters, and verbosity.
	 * @returns Markdown string with entries table.
	 * @throws {FeedError} With code `INVALID_INPUT` if validation fails.
	 */
	async entries(input: EntriesInput): Promise<string> {
		const parsed = EntriesInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return entriesTool(parsed.data, this.config);
	}

	/**
	 * Convenience alias for {@link entries}. The "what's new" scan.
	 *
	 * @param urls - One or more feed URLs.
	 * @param limit - Max entries to return (default: 20, max: 100).
	 * @returns Markdown string with entries table.
	 * @throws {FeedError} With code `INVALID_INPUT` if validation fails.
	 */
	async recent(urls: string[], limit?: number): Promise<string> {
		const parsed = EntriesInputSchema.safeParse({ urls, limit });
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return recentTool(parsed.data.urls, parsed.data.limit, this.config);
	}

	/**
	 * Fetch a single feed entry by its link URL.
	 * With `feed_url`, looks up the entry directly. Without it,
	 * discovers feeds on the domain and searches each one.
	 * Falls back to direct article extraction if no feed match.
	 *
	 * @param input - Entry link, optional feed URL, extraction and summary options.
	 * @returns Markdown string with entry metadata and body.
	 * @throws {FeedError} With code `INVALID_INPUT` if validation fails.
	 */
	async get(input: GetInput): Promise<string> {
		const parsed = GetInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return getTool(parsed.data, this.config);
	}

	/**
	 * Extract a full article from any URL. Not tied to feeds.
	 *
	 * @param input - Article URL, body char limit, and summary options.
	 * @returns Markdown string with article metadata and body.
	 * @throws {FeedError} With code `INVALID_INPUT` if validation fails.
	 */
	async article(input: ArticleInput): Promise<string> {
		const parsed = ArticleInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return articleTool(parsed.data, this.config);
	}

	/**
	 * Find RSS/Atom/JSON Feed URLs from a website.
	 * Checks `<link rel="alternate">` tags first, then probes common paths.
	 *
	 * @param input - Website URL to discover feeds on.
	 * @returns Markdown string with discovered feed URLs.
	 * @throws {FeedError} With code `INVALID_INPUT` if validation fails.
	 */
	async discover(input: DiscoverInput): Promise<string> {
		const parsed = DiscoverInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return discoverTool(parsed.data, this.config);
	}
}
