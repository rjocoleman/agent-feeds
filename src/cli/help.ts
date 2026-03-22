import pkg from "../../package.json";

const VERSION = pkg.version;

export function globalHelp(): string {
	return `agent-feeds v${VERSION}

Usage:
  agent-feeds <command> [options]

Commands:
  entries <url> [url...]       List entries from feeds
  recent <url> [url...]        Recent entries (shorthand)
  get <link>                   Read a single entry
  article <url>                Extract article from any URL
  discover <url>               Find feeds on a website

Global options:
  --help, -h                   Show help
  --version, -v                Show version
  --user-agent <string>        Custom User-Agent header
  --timeout <ms>               Fetch timeout in milliseconds

Run agent-feeds <command> --help for command-specific options.`;
}

export function version(): string {
	return VERSION;
}

export const commandHelp: Record<string, string> = {
	entries: `Usage: agent-feeds entries <url> [url...] [options]

Fetch and list entries from one or more feed URLs.

Options:
  --limit <n>           Max entries (default: 20, max: 100)
  --since <iso-date>    Entries published on or after this date
  --before <iso-date>   Entries published before this date
  --verbose             Show per-feed URLs and entry counts`,

	recent: `Usage: agent-feeds recent <url> [url...] [options]

Convenience alias for entries. The "what's new" scan.

Options:
  --limit <n>           Max entries (default: 20, max: 100)`,

	get: `Usage: agent-feeds get <link> [options]

Fetch a single feed entry by its link URL.

Options:
  --feed <url>          Feed URL (speeds up lookup, avoids discovery)
  --extract-full        Fetch full article content from link
  --summary             Prepend a summary block
  --max-chars <n>       Max body chars (default: 8000, 0 = omit, -1 = no limit)`,

	article: `Usage: agent-feeds article <url> [options]

Extract a full article from any URL. Not tied to feeds.

Options:
  --summary             Prepend a summary block
  --max-chars <n>       Max body chars (default: 12000, 0 = metadata only, -1 = no limit)`,

	discover: `Usage: agent-feeds discover <url>

Find RSS/Atom/JSON Feed URLs from a website.`,
};
