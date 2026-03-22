export type Summariser = (body: string) => Promise<string>;

export interface ReaderConfig {
	timeouts?: {
		fetch?: number;
		article?: number;
	};
	userAgent?: string;
	summarise?: Summariser;
}

export interface EntriesInput {
	urls: string[];
	limit?: number;
	since?: string;
	before?: string;
	verbose?: boolean;
}

export interface GetInput {
	link: string;
	feed_url?: string;
	extract_full?: boolean;
	max_body_chars?: number;
	summary_first?: boolean;
	summarise?: Summariser;
}

export interface ArticleInput {
	url: string;
	max_body_chars?: number;
	summary_first?: boolean;
	summarise?: Summariser;
}

export interface DiscoverInput {
	url: string;
}

export type FeedErrorCode =
	| "FETCH_FAILED"
	| "PARSE_FAILED"
	| "TIMEOUT"
	| "NOT_FOUND"
	| "EXTRACTION_FAILED"
	| "INVALID_INPUT";

export class FeedError extends Error {
	code: FeedErrorCode;

	constructor(code: FeedErrorCode, message: string) {
		super(message);
		this.name = "FeedError";
		this.code = code;
	}
}

export interface NormalisedEntry {
	title: string;
	link: string;
	date: Date | null;
	author: string | null;
	content: string | null;
	wordCount: number | null;
	source: string;
	feedUrl: string;
}

export interface ParsedFeed {
	title: string;
	entries: NormalisedEntry[];
	feedUrl: string;
}

export interface FeedResult {
	ok: true;
	feed: ParsedFeed;
}

export interface FeedFailure {
	ok: false;
	url: string;
	error: string;
}

export type FeedOutcome = FeedResult | FeedFailure;
