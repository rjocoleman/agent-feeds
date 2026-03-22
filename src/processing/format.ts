import type { NormalisedEntry } from "../types.js";

export function formatNumber(n: number): string {
	return n.toLocaleString("en-US");
}

export function truncateUrl(url: string, maxLength = 60): string {
	try {
		const u = new URL(url);
		let display = u.hostname + u.pathname;
		if (display.endsWith("/")) {
			display = display.slice(0, -1);
		}
		if (display.length > maxLength) {
			return `${display.slice(0, maxLength - 3)}...`;
		}
		return display;
	} catch {
		return url.length > maxLength ? `${url.slice(0, maxLength - 3)}...` : url;
	}
}

export function escapeCell(text: string): string {
	return text.replace(/\|/g, "\\|");
}

export function formatDate(date: Date | null): string {
	if (!date) return "--";
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	const h = String(date.getUTCHours()).padStart(2, "0");
	const min = String(date.getUTCMinutes()).padStart(2, "0");
	return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatWordCount(count: number | null): string {
	if (count === null) return "--";
	return formatNumber(count);
}

interface EntriesTableOptions {
	entries: NormalisedEntry[];
	multiSource: boolean;
}

export function renderEntriesTable(options: EntriesTableOptions): string {
	const { entries, multiSource } = options;
	const lines: string[] = [];

	if (multiSource) {
		lines.push("| # | Date | Source | Title | URL | Words |");
		lines.push("|---|------|--------|-------|-----|------:|");
	} else {
		lines.push("| # | Date | Title | URL | Words |");
		lines.push("|---|------|-------|-----|------:|");
	}

	for (let i = 0; i < entries.length; i++) {
		const e = entries[i];
		const title = escapeCell(e.title);
		const source = escapeCell(e.source);
		const row = multiSource
			? `| ${i + 1} | ${formatDate(e.date)} | ${source} | ${title} | ${truncateUrl(e.link)} | ${formatWordCount(e.wordCount)} |`
			: `| ${i + 1} | ${formatDate(e.date)} | ${title} | ${truncateUrl(e.link)} | ${formatWordCount(e.wordCount)} |`;
		lines.push(row);
	}

	return lines.join("\n");
}

export function renderMetadataTable(fields: [string, string][]): string {
	const lines = ["| Field | Value |", "|-------|-------|"];
	for (const [key, value] of fields) {
		lines.push(`| ${escapeCell(key)} | ${escapeCell(value)} |`);
	}
	return lines.join("\n");
}

export function normaliseWhitespace(text: string): string {
	return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function truncateBody(text: string, maxChars: number): string {
	if (maxChars === -1) return text;
	if (maxChars === 0) return "";
	if (text.length <= maxChars) return text;
	return `${text.slice(0, maxChars)}...`;
}

export function wordCountFooter(
	type: "feed content" | "full article" | "direct extraction",
	text: string,
): string {
	const words = text
		.replace(/<[^>]*>/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 0).length;
	return `[--- ${type}, ${formatNumber(words)} words ---]`;
}
