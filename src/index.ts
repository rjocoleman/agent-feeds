import { AgentRssReader } from "./reader.js";
import type { ReaderConfig } from "./types.js";

export function createReader(config?: ReaderConfig): AgentRssReader {
	return new AgentRssReader(config);
}

export { AgentRssReader } from "./reader.js";
export type {
	ArticleInput,
	DiscoverInput,
	EntriesInput,
	FeedErrorCode,
	FeedFailure,
	FeedOutcome,
	FeedResult,
	GetInput,
	NormalisedEntry,
	ParsedFeed,
	ReaderConfig,
	Summariser,
} from "./types.js";
export { FeedError } from "./types.js";
