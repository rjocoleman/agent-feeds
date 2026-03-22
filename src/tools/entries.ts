import { formatNumber, renderEntriesTable } from "../processing/format.js";
import { parseFeed } from "../processing/parse.js";
import type { FeedOutcome, NormalisedEntry, ReaderConfig } from "../types.js";

interface ValidatedEntriesInput {
	urls: string[];
	limit: number;
	since?: string;
	before?: string;
	verbose: boolean;
}

export async function entries(
	input: ValidatedEntriesInput,
	config: ReaderConfig,
): Promise<string> {
	const outcomes: FeedOutcome[] = await Promise.all(
		input.urls.map((url) => parseFeed(url, config)),
	);

	const failures = outcomes.filter((o) => !o.ok);
	const successes = outcomes.filter((o) => o.ok);

	let allEntries: NormalisedEntry[] = successes.flatMap((o) => o.feed.entries);

	if (input.since) {
		const sinceDate = new Date(input.since);
		allEntries = allEntries.filter((e) => e.date && e.date >= sinceDate);
	}
	if (input.before) {
		const beforeDate = new Date(input.before);
		allEntries = allEntries.filter((e) => e.date && e.date < beforeDate);
	}

	allEntries.sort((a, b) => {
		if (!a.date && !b.date) return 0;
		if (!a.date) return 1;
		if (!b.date) return -1;
		return b.date.getTime() - a.date.getTime();
	});

	allEntries = allEntries.slice(0, input.limit);

	const multiSource = successes.length > 1;
	const feedCount = successes.length;
	const lines: string[] = ["# Entries", ""];

	// Summary line
	const parts: string[] = [
		`**${formatNumber(allEntries.length)} entries from ${feedCount} feed${feedCount !== 1 ? "s" : ""}`,
	];
	if (input.since) {
		parts[0] += ` since ${input.since.split("T")[0]}`;
	}
	if (input.before) {
		parts[0] += ` before ${input.before.split("T")[0]}`;
	}
	parts[0] += "**";
	lines.push(parts[0]);

	// Sources
	if (multiSource) {
		if (input.verbose) {
			lines.push("**Sources:**");
			for (const outcome of successes) {
				const feed = outcome.feed;
				lines.push(
					`- ${feed.title} (${feed.feedUrl}) -- ${feed.entries.length} entries`,
				);
			}
		} else {
			const names = successes.map((o) => o.feed.title);
			lines.push(`**Sources:** ${names.join(", ")}`);
		}
	}

	lines.push("");

	// Failed feeds
	for (const fail of failures) {
		lines.push(`> **Failed:** ${fail.url} -- ${fail.error}`);
	}
	if (failures.length > 0) {
		lines.push("");
	}

	// Table
	lines.push(renderEntriesTable({ entries: allEntries, multiSource }));

	return lines.join("\n");
}
