/**
 * @module
 *
 * Pure TypeScript library for reading RSS/Atom/JSON Feed.
 * Markdown output optimised for LLM context windows. Runs on Bun.
 *
 * @example
 * ```typescript
 * import { createReader } from "@rjocoleman/agent-feeds";
 *
 * const rss = createReader();
 * const latest = await rss.recent(["https://hnrss.org/frontpage"]);
 * ```
 */

import { AgentRssReader } from "./reader.js";
import type { ReaderConfig } from "./types.js";

/**
 * Create a new feed reader instance.
 *
 * @param config - Optional configuration for timeouts, user agent, and summariser.
 * @returns A stateless reader with methods for fetching and reading feeds.
 *
 * @example
 * ```typescript
 * const rss = createReader();
 * const withConfig = createReader({
 *   timeouts: { fetch: 10_000, article: 15_000 },
 *   userAgent: "my-agent/1.0",
 *   summarise: async (body) => summarise(body),
 * });
 * ```
 */
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
