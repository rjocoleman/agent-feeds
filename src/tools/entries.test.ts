import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mockFetch, restoreFetch } from "../testing/mock-fetch.js";
import { entries } from "./entries.js";

const fixturesDir = join(import.meta.dir, "../fixtures");
const rss2Xml = readFileSync(join(fixturesDir, "rss2.xml"), "utf-8");
const atomXml = readFileSync(join(fixturesDir, "atom.xml"), "utf-8");

afterAll(() => {
	restoreFetch();
});

describe("entries", () => {
	test("single feed returns entries table", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await entries(
			{
				urls: ["https://test.example.com/feed.xml"],
				limit: 20,
				verbose: false,
			},
			{},
		);

		expect(result).toContain("# Entries");
		expect(result).toContain("3 entries from 1 feed");
		expect(result).toContain("First Post");
		expect(result).toContain("Second Post");
		expect(result).toContain("Third Post");
		// Single source: no Source column
		expect(result).not.toMatch(/\| # \| Date \| Source \|/);
	});

	test("multiple feeds includes Source column", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
			"https://atom.example.com/atom.xml": { ok: true, text: atomXml },
		});

		const result = await entries(
			{
				urls: [
					"https://test.example.com/feed.xml",
					"https://atom.example.com/atom.xml",
				],
				limit: 20,
				verbose: false,
			},
			{},
		);

		expect(result).toContain("5 entries from 2 feeds");
		expect(result).toContain("| # | Date | Source | Title | URL | Words |");
		expect(result).toContain("**Sources:** Test Blog, Atom Test Feed");
	});

	test("verbose mode expands sources", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
			"https://atom.example.com/atom.xml": { ok: true, text: atomXml },
		});

		const result = await entries(
			{
				urls: [
					"https://test.example.com/feed.xml",
					"https://atom.example.com/atom.xml",
				],
				limit: 20,
				verbose: true,
			},
			{},
		);

		expect(result).toContain("**Sources:**");
		expect(result).toContain("- Test Blog (https://test.example.com/feed.xml)");
		expect(result).toContain(
			"- Atom Test Feed (https://atom.example.com/atom.xml)",
		);
	});

	test("limit caps results", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await entries(
			{ urls: ["https://test.example.com/feed.xml"], limit: 2, verbose: false },
			{},
		);

		expect(result).toContain("2 entries from 1 feed");
	});

	test("since filter works", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await entries(
			{
				urls: ["https://test.example.com/feed.xml"],
				limit: 20,
				since: "2026-03-21T00:00:00Z",
				verbose: false,
			},
			{},
		);

		expect(result).toContain("First Post");
		expect(result).not.toContain("Second Post");
		expect(result).not.toContain("Third Post");
	});

	test("before filter works", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await entries(
			{
				urls: ["https://test.example.com/feed.xml"],
				limit: 20,
				before: "2026-03-20T00:00:00Z",
				verbose: false,
			},
			{},
		);

		expect(result).not.toContain("First Post");
		expect(result).not.toContain("Second Post");
		expect(result).toContain("Third Post");
		expect(result).toContain("before 2026-03-20");
	});

	test("failed feed shows error line", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
			"https://broken.example.com/feed": { ok: false, text: "" },
		});

		const result = await entries(
			{
				urls: [
					"https://test.example.com/feed.xml",
					"https://broken.example.com/feed",
				],
				limit: 20,
				verbose: false,
			},
			{},
		);

		expect(result).toContain("> **Failed:** https://broken.example.com/feed");
	});

	test("entries sorted by date descending", async () => {
		mockFetch({
			"https://test.example.com/feed.xml": { ok: true, text: rss2Xml },
		});

		const result = await entries(
			{
				urls: ["https://test.example.com/feed.xml"],
				limit: 20,
				verbose: false,
			},
			{},
		);

		const firstIdx = result.indexOf("First Post");
		const secondIdx = result.indexOf("Second Post");
		const thirdIdx = result.indexOf("Third Post");
		expect(firstIdx).toBeLessThan(secondIdx);
		expect(secondIdx).toBeLessThan(thirdIdx);
	});
});
