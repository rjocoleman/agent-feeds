#!/usr/bin/env bun
import {
	runArticle,
	runDiscover,
	runEntries,
	runGet,
	runRecent,
} from "./cli/commands.js";
import { commandHelp, globalHelp, version } from "./cli/help.js";
import { createReader } from "./index.js";
import { FeedError } from "./types.js";

const args = process.argv.slice(2);
const command = args[0];

function parseFlag(flag: string): string | undefined {
	const idx = args.indexOf(flag);
	if (idx === -1 || idx + 1 >= args.length) return undefined;
	return args[idx + 1];
}

function hasFlag(flag: string): boolean {
	return args.includes(flag);
}

function parseNumber(flag: string): number | undefined {
	const val = parseFlag(flag);
	if (val === undefined) return undefined;
	const n = Number(val);
	if (Number.isNaN(n)) return undefined;
	return n;
}

async function main() {
	if (!command || command === "--help" || command === "-h") {
		console.log(globalHelp());
		process.exit(0);
	}

	if (command === "--version" || command === "-v") {
		console.log(version());
		process.exit(0);
	}

	if (hasFlag("--help") || hasFlag("-h")) {
		const help = commandHelp[command];
		if (help) {
			console.log(help);
			process.exit(0);
		}
	}

	const rss = createReader({
		userAgent: parseFlag("--user-agent"),
		timeouts: {
			fetch: parseNumber("--timeout"),
		},
	});

	const commands: Record<string, () => Promise<string>> = {
		entries: () => runEntries(rss, args),
		recent: () => runRecent(rss, args),
		get: () => runGet(rss, args),
		article: () => runArticle(rss, args),
		discover: () => runDiscover(rss, args),
	};

	const run = commands[command];
	if (!run) {
		console.error(`Unknown command: ${command}`);
		console.error("Run agent-feeds --help for available commands");
		process.exit(1);
	}

	const result = await run();
	console.log(result);
}

main().catch((err) => {
	if (err instanceof FeedError) {
		console.error(`${err.code}: ${err.message}`);
	} else {
		console.error(err.message);
	}
	process.exit(1);
});
