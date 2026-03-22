/** Async callback that generates a summary from body text. */
export type Summariser = (body: string) => Promise<string>;

/** Configuration for {@link AgentRssReader}. */
export interface ReaderConfig {
	/** Request timeouts in milliseconds. */
	timeouts?: {
		/** Per-feed fetch timeout. Default: 10,000ms. */
		fetch?: number;
		/** Full article extraction timeout. Default: 15,000ms. */
		article?: number;
	};
	/** HTTP User-Agent header. Default: `"agent-feeds/1.0"`. */
	userAgent?: string;
	/** Default summariser callback. Can be overridden per-call. */
	summarise?: Summariser;
}

/** Input for {@link AgentRssReader.entries}. */
export interface EntriesInput {
	/** One or more feed URLs to fetch. */
	urls: string[];
	/** Max entries to return (1-100). Default: 20. */
	limit?: number;
	/** ISO datetime string. Only entries published on or after this date. */
	since?: string;
	/** ISO datetime string. Only entries published before this date. */
	before?: string;
	/** Show per-feed URLs and entry counts. Default: false. */
	verbose?: boolean;
}

/** Input for {@link AgentRssReader.get}. */
export interface GetInput {
	/** Entry permalink URL. */
	link: string;
	/** Feed URL. Speeds up lookup by avoiding discovery. */
	feed_url?: string;
	/** Fetch full article content from the link URL. Default: false. */
	extract_full?: boolean;
	/** Max body characters. 0 = omit body, -1 = no limit. Default: 8,000. */
	max_body_chars?: number;
	/** Prepend a summary block. Default: false. */
	summary_first?: boolean;
	/** Per-call summariser override. */
	summarise?: Summariser;
}

/** Input for {@link AgentRssReader.article}. */
export interface ArticleInput {
	/** Any article URL. */
	url: string;
	/** Max body characters. 0 = metadata only, -1 = no limit. Default: 12,000. */
	max_body_chars?: number;
	/** Prepend a summary block. Default: false. */
	summary_first?: boolean;
	/** Per-call summariser override. */
	summarise?: Summariser;
}

/** Input for {@link AgentRssReader.discover}. */
export interface DiscoverInput {
	/** Website URL to discover feeds on. */
	url: string;
}

/** Error codes returned by {@link FeedError}. */
export type FeedErrorCode =
	| "FETCH_FAILED"
	| "PARSE_FAILED"
	| "TIMEOUT"
	| "NOT_FOUND"
	| "EXTRACTION_FAILED"
	| "INVALID_INPUT";

/** Error type thrown by all agent-feeds operations. */
export class FeedError extends Error {
	/** Machine-readable error code. */
	code: FeedErrorCode;

	constructor(code: FeedErrorCode, message: string) {
		super(message);
		this.name = "FeedError";
		this.code = code;
	}
}

/** A normalised feed entry, independent of feed format. */
export interface NormalisedEntry {
	/** Entry title. */
	title: string;
	/** Entry permalink URL. */
	link: string;
	/** Publication date, or null if unavailable. */
	date: Date | null;
	/** Author name, or null if unavailable. */
	author: string | null;
	/** Entry content (HTML or text), or null if link-only. */
	content: string | null;
	/** Word count of content, or null if no content. */
	wordCount: number | null;
	/** Feed source name. */
	source: string;
	/** URL of the feed this entry came from. */
	feedUrl: string;
}

/** A parsed feed with its entries. */
export interface ParsedFeed {
	/** Feed title. */
	title: string;
	/** Normalised entries from the feed. */
	entries: NormalisedEntry[];
	/** URL the feed was fetched from. */
	feedUrl: string;
}

/** Successful feed fetch result. */
export interface FeedResult {
	ok: true;
	/** The parsed feed data. */
	feed: ParsedFeed;
}

/** Failed feed fetch result. */
export interface FeedFailure {
	ok: false;
	/** URL that failed. */
	url: string;
	/** Human-readable error description. */
	error: string;
}

/** Result of fetching a feed - either success or failure. */
export type FeedOutcome = FeedResult | FeedFailure;
