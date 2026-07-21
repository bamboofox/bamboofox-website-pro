import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const oldRepo = path.join(root, "bamboofox-blog-old");
const sourceDirectory = path.join(oldRepo, "_posts");
const destinationDirectory = path.join(root, "public/blog/legacy-images");
const run = promisify(execFile);
const sourceFiles = (await fs.readdir(sourceDirectory)).filter(filename => filename.endsWith(".md"));
const documents = await Promise.all(sourceFiles.map(filename => fs.readFile(path.join(sourceDirectory, filename), "utf8")));
documents.push(execFileSync("git", ["-C", oldRepo, "show", "origin/inctf2020:_posts/2020-08-03-inctf-2020-write-up.md"], { encoding: "utf8" }));

const imageURLs = [...new Set(documents.flatMap(document => document.match(/https:\/\/i\.imgur\.com\/[A-Za-z0-9._-]+\.(?:png|jpe?g|gif)/gi) || []))];
await fs.mkdir(destinationDirectory, { recursive: true });
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "bamboofox-legacy-images-"));

try {
	for (const imageURL of imageURLs) {
		const filename = new URL(imageURL).pathname.split("/").pop();
		const basename = filename.replace(/\.(?:png|jpe?g|gif)$/i, "");
		const input = path.join(temporaryDirectory, filename);
		const output = path.join(destinationDirectory, `${basename}.webp`);
		const response = await fetch(imageURL, { headers: { "User-Agent": "BambooFox website archive migration" } });
		if (!response.ok) throw new Error(`${imageURL} returned ${response.status}`);
		await fs.writeFile(input, Buffer.from(await response.arrayBuffer()));
		await run("cwebp", ["-quiet", "-q", "80", input, "-o", output]);
	}
} finally {
	await fs.rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Archived ${imageURLs.length} legacy article images as WebP at quality 80.`);
