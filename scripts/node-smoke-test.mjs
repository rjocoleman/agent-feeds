import { createReader, FeedError, AgentRssReader } from "../dist/index.js";

const rss = createReader();

if (typeof createReader !== "function") throw new Error("createReader not exported");
if (typeof FeedError !== "function") throw new Error("FeedError not exported");
if (typeof AgentRssReader !== "function") throw new Error("AgentRssReader not exported");
if (!(rss instanceof AgentRssReader)) throw new Error("createReader did not return AgentRssReader");

const methods = ["entries", "recent", "get", "article", "discover"];
for (const method of methods) {
	if (typeof rss[method] !== "function") throw new Error(`missing method: ${method}`);
}

try {
	await rss.entries({ urls: [] });
	throw new Error("should have thrown on empty urls");
} catch (err) {
	if (!(err instanceof FeedError) || err.code !== "INVALID_INPUT") {
		throw new Error(`expected INVALID_INPUT FeedError, got: ${err}`);
	}
}

console.log("Node smoke test passed");
