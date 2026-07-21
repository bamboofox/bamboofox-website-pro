#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const authorsDirectory = path.join(root, "src/content/authors");
const outputDirectory = path.join(root, "public/authors");
const teamLogo = path.join(root, "public/brand/logo-square.webp");
const run = promisify(execFile);

await mkdir(outputDirectory, { recursive: true });
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "bamboofox-avatars-"));

const files = (await readdir(authorsDirectory)).filter(file => file.endsWith(".json")).sort();

try {
	for (const file of files) {
		const id = path.basename(file, ".json");
		const author = JSON.parse(await readFile(path.join(authorsDirectory, file), "utf8"));
		const output = path.join(outputDirectory, `${id}.webp`);
		let input = teamLogo;

		if (author.type === "Organization") {
			input = path.join(temporaryDirectory, `${id}.png`);
			await sharp(teamLogo).png().toFile(input);
		} else {
			const source = author.github ? `${author.github}.png?size=512` : "https://avatars.githubusercontent.com/u/0?v=4";
			const response = await fetch(source, {
				headers: { "user-agent": "BambooFox website avatar archiver" },
				signal: AbortSignal.timeout(15_000)
			});

			if (!response.ok) throw new Error(`${id}: avatar request returned ${response.status}`);

			input = path.join(temporaryDirectory, `${id}.source`);
			await writeFile(input, Buffer.from(await response.arrayBuffer()));
		}

		await run("cwebp", ["-quiet", "-q", "80", "-resize", "256", "0", input, "-o", output]);
	}
} finally {
	await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Archived ${files.length} author avatars as 256px WebP at quality 80.`);
