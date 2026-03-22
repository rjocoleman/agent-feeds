import { z } from "zod/v4";
import type { Summariser } from "./types.js";

export const EntriesInputSchema = z.object({
	urls: z.array(z.url()).min(1),
	limit: z.number().int().min(1).max(100).optional().default(20),
	since: z.iso.datetime().optional(),
	before: z.iso.datetime().optional(),
	verbose: z.boolean().optional().default(false),
});

export const GetInputSchema = z.object({
	link: z.url(),
	feed_url: z.url().optional(),
	extract_full: z.boolean().optional().default(false),
	max_body_chars: z.number().int().min(-1).optional().default(8000),
	summary_first: z.boolean().optional().default(false),
	summarise: z
		.custom<Summariser>((val) => typeof val === "function")
		.optional(),
});

export const ArticleInputSchema = z.object({
	url: z.url(),
	max_body_chars: z.number().int().min(-1).optional().default(12000),
	summary_first: z.boolean().optional().default(false),
	summarise: z
		.custom<Summariser>((val) => typeof val === "function")
		.optional(),
});

export const DiscoverInputSchema = z.object({
	url: z.url(),
});
