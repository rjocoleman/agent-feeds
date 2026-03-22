import type { AgentRssReader } from "../reader.js";

function parseFlag(args: string[], flag: string): string | undefined {
	const idx = args.indexOf(flag);
	if (idx === -1 || idx + 1 >= args.length) return undefined;
	return args[idx + 1];
}

function hasFlag(args: string[], flag: string): boolean {
	return args.includes(flag);
}

function getUrls(args: string[], startIdx: number): string[] {
	const urls: string[] = [];
	for (let i = startIdx; i < args.length; i++) {
		if (args[i].startsWith("-")) break;
		urls.push(args[i]);
	}
	return urls;
}

function parseNumber(args: string[], flag: string): number | undefined {
	const val = parseFlag(args, flag);
	if (val === undefined) return undefined;
	const n = Number(val);
	if (Number.isNaN(n)) {
		console.error(`Error: ${flag} must be a number, got "${val}"`);
		process.exit(1);
	}
	return n;
}

export async function runEntries(
	rss: AgentRssReader,
	args: string[],
): Promise<string> {
	const urls = getUrls(args, 1);
	if (urls.length === 0) {
		console.error("Error: at least one URL required");
		console.error("Run agent-feeds entries --help for usage");
		process.exit(1);
	}
	return rss.entries({
		urls,
		limit: parseNumber(args, "--limit"),
		since: parseFlag(args, "--since"),
		before: parseFlag(args, "--before"),
		verbose: hasFlag(args, "--verbose"),
	});
}

export async function runRecent(
	rss: AgentRssReader,
	args: string[],
): Promise<string> {
	const urls = getUrls(args, 1);
	if (urls.length === 0) {
		console.error("Error: at least one URL required");
		console.error("Run agent-feeds recent --help for usage");
		process.exit(1);
	}
	return rss.recent(urls, parseNumber(args, "--limit"));
}

export async function runGet(
	rss: AgentRssReader,
	args: string[],
): Promise<string> {
	const link = args[1];
	if (!link || link.startsWith("--")) {
		console.error("Error: link URL required");
		console.error("Run agent-feeds get --help for usage");
		process.exit(1);
	}
	return rss.get({
		link,
		feed_url: parseFlag(args, "--feed"),
		extract_full: hasFlag(args, "--extract-full"),
		summary_first: hasFlag(args, "--summary"),
		max_body_chars: parseNumber(args, "--max-chars"),
	});
}

export async function runArticle(
	rss: AgentRssReader,
	args: string[],
): Promise<string> {
	const url = args[1];
	if (!url || url.startsWith("--")) {
		console.error("Error: article URL required");
		console.error("Run agent-feeds article --help for usage");
		process.exit(1);
	}
	return rss.article({
		url,
		summary_first: hasFlag(args, "--summary"),
		max_body_chars: parseNumber(args, "--max-chars"),
	});
}

export async function runDiscover(
	rss: AgentRssReader,
	args: string[],
): Promise<string> {
	const url = args[1];
	if (!url || url.startsWith("--")) {
		console.error("Error: website URL required");
		console.error("Run agent-feeds discover --help for usage");
		process.exit(1);
	}
	return rss.discover({ url });
}
