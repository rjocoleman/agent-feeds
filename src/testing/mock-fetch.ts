let savedFetch: typeof fetch | null = null;

export function mockFetch(
	responses: Record<string, { ok: boolean; text: string }>,
): void {
	if (!savedFetch) {
		savedFetch = globalThis.fetch;
	}
	globalThis.fetch = (async (input: RequestInfo | URL) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof Request
					? input.url
					: input.toString();
		const resp = responses[url];
		if (!resp) {
			return {
				ok: false,
				status: 404,
				text: async () => "Not found",
			} as Response;
		}
		return {
			ok: resp.ok,
			status: resp.ok ? 200 : 500,
			text: async () => resp.text,
		} as Response;
	}) as unknown as typeof fetch;
}

export function restoreFetch(): void {
	if (savedFetch) {
		globalThis.fetch = savedFetch;
		savedFetch = null;
	}
}
