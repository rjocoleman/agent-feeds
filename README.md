# agent-feeds

[![JSR](https://jsr.io/badges/@rjocoleman/agent-feeds)](https://jsr.io/@rjocoleman/agent-feeds)

Pure TypeScript library for reading RSS/Atom/JSON Feed. Markdown output optimised for LLM context windows.

- **Library, not a server.** Export functions. The consumer decides how to expose them.
- **Read-only.** Fetch and parse. No subscriptions, no state, no OPML.
- **Markdown-native.** Every response is structured markdown ready for direct injection into agent context.
- **Token-efficient.** Full article extraction from links, not just feed summaries. Truncate to budget.
- **Stateless.** No feed list. No read tracking. No cache. URLs in, markdown out.

## Install

```bash
bunx jsr add @rjocoleman/agent-feeds
```

## Quick Start

```typescript
import { createReader } from "@rjocoleman/agent-feeds";

const rss = createReader();

// Scan feeds
const latest = await rss.recent(["https://hnrss.org/frontpage"]);

// Read a specific entry
const post = await rss.get({
  link: "https://simonwillison.net/2026/Mar/21/profiling-hacker-news-users/",
  feed_url: "https://simonwillison.net/atom/everything/",
  extract_full: true,
});

// Extract any article
const article = await rss.article({
  url: "https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/",
});

// Find feeds on a site
const feeds = await rss.discover({ url: "https://kubernetes.io" });
```

## API

All functions return markdown strings (`Promise<string>`).

### `rss.entries(input)`

Fetch and list entries from one or more feed URLs.

```typescript
await rss.entries({
  urls: ["https://simonwillison.net/atom/everything/"],
  since: "2026-03-20T00:00:00Z",
  limit: 10,
  verbose: true,
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `urls` | required | One or more feed URLs |
| `limit` | `20` | Max entries (1-100) |
| `since` | - | ISO date, entries on or after |
| `before` | - | ISO date, entries before |
| `verbose` | `false` | Show per-feed URLs and counts |

### `rss.recent(urls, limit?)`

Convenience alias for `entries({ urls, limit })`. The "what's new" scan.

```typescript
await rss.recent(["https://hnrss.org/frontpage", "https://kubernetes.io/feed.xml"]);
```

### `rss.get(input)`

Fetch a single feed entry by its link URL.

```typescript
await rss.get({
  link: "https://simonwillison.net/2026/Mar/21/profiling-hacker-news-users/",
  feed_url: "https://simonwillison.net/atom/everything/",
  extract_full: true,
  summary_first: true,
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `link` | required | Entry permalink URL |
| `feed_url` | - | Feed URL, speeds up lookup |
| `extract_full` | `false` | Fetch full article from link |
| `max_body_chars` | `8000` | `0` = omit body, `-1` = no limit |
| `summary_first` | `false` | Prepend summary block |
| `summarise` | - | Per-call summariser override |

### `rss.article(input)`

Extract a full article from any URL. Not tied to feeds.

```typescript
await rss.article({
  url: "https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/",
  summary_first: true,
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `url` | required | Any article URL |
| `max_body_chars` | `12000` | `0` = metadata only, `-1` = no limit |
| `summary_first` | `false` | Prepend summary block |
| `summarise` | - | Per-call summariser override |

### `rss.discover(input)`

Find RSS/Atom/JSON Feed URLs from a website.

```typescript
await rss.discover({ url: "https://simonwillison.net" });
```

## Configuration

```typescript
interface ReaderConfig {
  timeouts?: {
    fetch?: number;       // default: 10_000ms per feed
    article?: number;     // default: 15_000ms for full article extraction
  };
  userAgent?: string;     // default: "agent-feeds/1.0"
  summarise?: Summariser; // default summariser callback
}
```

### Summariser

Pass a callback to generate entry/article summaries. The library does not ship a model.

```typescript
const rss = createReader({
  summarise: async (body) => {
    const resp = await claude.messages.create({ /* ... */ });
    return resp.content[0].text;
  },
});

// Per-call override
await rss.get({
  link: "https://simonwillison.net/2026/Mar/21/profiling-hacker-news-users/",
  summary_first: true,
  summarise: async (body) => ollama(body),
});
```

Without a summariser, the fallback extracts the first paragraph (up to 300 chars).

## Error Handling

All errors are `FeedError` instances with a `code` property:

| Code | Meaning |
|------|---------|
| `FETCH_FAILED` | HTTP error fetching feed or article |
| `PARSE_FAILED` | Content is not valid RSS/Atom/JSON Feed |
| `TIMEOUT` | Exceeded configured timeout |
| `EXTRACTION_FAILED` | Article extraction returned no content |
| `INVALID_INPUT` | Validation failed |

```typescript
import { FeedError } from "@rjocoleman/agent-feeds";

try {
  await rss.get({ link: "https://example.com/missing" });
} catch (err) {
  if (err instanceof FeedError && err.code === "EXTRACTION_FAILED") {
    // handle failed extraction
  }
}
```

## CLI

agent-feeds includes a CLI for direct use from the command line. The CLI requires Bun.

### Commands

```bash
agent-feeds recent https://hnrss.org/frontpage --limit 5
agent-feeds entries https://simonwillison.net/atom/everything/ --since 2026-03-20T00:00:00Z --verbose
agent-feeds get https://simonwillison.net/2026/Mar/20/turbo-pascal/ --feed https://simonwillison.net/atom/everything/ --extract-full
agent-feeds article https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/ --summary
agent-feeds discover https://kubernetes.io/blog
```

Run `agent-feeds --help` for full options.

## Development

```bash
bun install
bun run check     # lint + typecheck + test
bun test          # tests only
bun run lint:fix  # auto-fix lint/format
bun run typecheck # TypeScript only
bun run cli       # run CLI locally
```

### Releasing

```bash
bun run version patch   # 0.1.0 -> 0.1.1 (also: minor, major, or explicit x.y.z)
git add -A && git commit -m "v0.1.1"
git tag v0.1.1
git push origin main --tags
```

Pushing a `v*` tag triggers CI checks and publishes to [JSR](https://jsr.io).

### CI

GitHub Actions runs lint, typecheck, tests, and build on every push to `main` and all PRs. The publish workflow runs the same checks before publishing to JSR.

## Stack

| Concern | Package |
|---------|---------|
| Runtime | [Bun](https://bun.sh) |
| Feed parsing | [rss-parser](https://github.com/rbren/rss-parser) (RSS 2.0, Atom) + native JSON Feed |
| Article extraction | [@extractus/article-extractor](https://github.com/nicedoc/article-extractor) |
| HTML to markdown | [turndown](https://github.com/mixmark-io/turndown) |
| Validation | [zod](https://github.com/colinhacks/zod) |
| Linting/formatting | [Biome](https://biomejs.dev) |
| Registry | [JSR](https://jsr.io) |
