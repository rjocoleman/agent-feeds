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

export class AgentRssReader {
	private config: ReaderConfig;

	constructor(config: ReaderConfig = {}) {
		this.config = config;
	}

	async entries(input: EntriesInput): Promise<string> {
		const parsed = EntriesInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return entriesTool(parsed.data, this.config);
	}

	async recent(urls: string[], limit?: number): Promise<string> {
		const parsed = EntriesInputSchema.safeParse({ urls, limit });
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return recentTool(parsed.data.urls, parsed.data.limit, this.config);
	}

	async get(input: GetInput): Promise<string> {
		const parsed = GetInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return getTool(parsed.data, this.config);
	}

	async article(input: ArticleInput): Promise<string> {
		const parsed = ArticleInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return articleTool(parsed.data, this.config);
	}

	async discover(input: DiscoverInput): Promise<string> {
		const parsed = DiscoverInputSchema.safeParse(input);
		if (!parsed.success) {
			throw new FeedError("INVALID_INPUT", parsed.error.message);
		}
		return discoverTool(parsed.data, this.config);
	}
}
