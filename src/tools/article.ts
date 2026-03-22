import { extractArticle } from "../processing/extract.js";
import {
	normaliseWhitespace,
	renderMetadataTable,
	truncateBody,
	wordCountFooter,
} from "../processing/format.js";
import { generateSummary } from "../processing/summary.js";
import type { ReaderConfig, Summariser } from "../types.js";
import { FeedError } from "../types.js";

interface ValidatedArticleInput {
	url: string;
	max_body_chars: number;
	summary_first: boolean;
	summarise?: Summariser;
}

export async function article(
	input: ValidatedArticleInput,
	config: ReaderConfig,
): Promise<string> {
	try {
		const extracted = await extractArticle(input.url, config);
		const body = normaliseWhitespace(extracted.content);

		const lines: string[] = [`# ${extracted.title ?? "Extracted Article"}`];

		if (input.summary_first && body) {
			const summary = await generateSummary(body, input.summarise, config);
			if (summary) {
				lines.push("");
				lines.push(`> **Summary:** ${summary}`);
			}
		}

		const fields: [string, string][] = [["URL", input.url]];
		if (extracted.date) {
			fields.push(["Date", extracted.date]);
		}
		if (extracted.author) {
			fields.push(["Author", extracted.author]);
		}

		lines.push("");
		lines.push(renderMetadataTable(fields));
		lines.push("");
		lines.push("---");

		if (input.max_body_chars !== 0 && body) {
			const truncated = truncateBody(body, input.max_body_chars);
			lines.push("");
			lines.push(truncated);
			lines.push("");
			lines.push(wordCountFooter("full article", body));
		}

		return lines.join("\n");
	} catch (err) {
		if (err instanceof FeedError) {
			return [
				"# Could not extract article",
				"",
				renderMetadataTable([
					["URL", input.url],
					["Error", err.message],
				]),
			].join("\n");
		}
		throw err;
	}
}
