#!/usr/bin/env bun

/**
 * Version bump script that keeps package.json and jsr.json in sync.
 *
 * Usage:
 *   bun run version patch    # 0.1.0 -> 0.1.1
 *   bun run version minor    # 0.1.0 -> 0.2.0
 *   bun run version major    # 0.1.0 -> 1.0.0
 *   bun run version 0.2.0    # explicit version
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const bump = process.argv[2];

if (!bump) {
	console.error("Usage: bun run version <patch|minor|major|x.y.z>");
	process.exit(1);
}

const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const current = pkg.version as string;
const parts = current.split(".").map(Number);
const [major, minor, patch] = parts as [number, number, number];

if (!parts.every(Number.isFinite)) {
	console.error(`Current version "${current}" is not in X.Y.Z format`);
	process.exit(1);
}

let next: string;
switch (bump) {
	case "patch":
		next = `${major}.${minor}.${patch + 1}`;
		break;
	case "minor":
		next = `${major}.${minor + 1}.0`;
		break;
	case "major":
		next = `${major + 1}.0.0`;
		break;
	default:
		if (!/^\d+\.\d+\.\d+$/.test(bump)) {
			console.error(`Invalid version: ${bump}`);
			process.exit(1);
		}
		next = bump;
}

pkg.version = next;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

const jsrPath = join(root, "jsr.json");
const jsr = JSON.parse(readFileSync(jsrPath, "utf-8"));
jsr.version = next;
writeFileSync(jsrPath, `${JSON.stringify(jsr, null, "\t")}\n`);

console.log(`${current} -> ${next}`);
console.log("Updated: package.json, jsr.json");
console.log(`\nNext steps:`);
console.log(`  git add -A && git commit -m "v${next}"`);
console.log(`  git tag v${next}`);
console.log(`  git push origin main --tags`);
