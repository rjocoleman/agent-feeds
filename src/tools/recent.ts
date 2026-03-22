import type { ReaderConfig } from "../types.js";
import { entries } from "./entries.js";

export async function recent(
	urls: string[],
	limit: number | undefined,
	config: ReaderConfig,
): Promise<string> {
	return entries(
		{
			urls,
			limit: limit ?? 20,
			verbose: false,
		},
		config,
	);
}
