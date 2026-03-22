import type { ReaderConfig, Summariser } from "../types.js";

function deterministicFallback(body: string): string {
	const paragraphs = body.split(/\n\s*\n/);
	const first = paragraphs.find((p) => p.trim().length > 0);
	if (!first) return "";
	const trimmed = first.trim();
	if (trimmed.length <= 300) return trimmed;
	return `${trimmed.slice(0, 297)}...`;
}

export async function generateSummary(
	body: string,
	perCall?: Summariser,
	config?: ReaderConfig,
): Promise<string> {
	const summariser = perCall ?? config?.summarise;
	if (summariser) {
		return summariser(body);
	}
	return deterministicFallback(body);
}
