import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const logoPath = path.join(root, "public/logo.svg");
const brandDirectory = path.join(root, "public/brand");
const logoSVG = await fs.readFile(logoPath, "utf8");
const run = promisify(execFile);

await fs.mkdir(brandDirectory, { recursive: true });
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "bamboofox-brand-"));

const logoWithBackground = color => Buffer.from(logoSVG.replace(/(<svg[^>]*>)/, `$1<rect width="768" height="1000" fill="${color}"/>`));

const squareBackground = Buffer.from(`
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="104" fill="#082f24"/>
  <path d="M0 425C118 368 207 398 296 423C388 449 444 420 512 379V512H0Z" fill="#041f18"/>
</svg>`);
const squareLogo = await sharp(logoWithBackground("#082f24"))
	.resize({ width: 280, height: 390, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
	.png()
	.toBuffer();
const square = await sharp(squareBackground)
	.composite([{ input: squareLogo, left: 116, top: 65 }])
	.png({ compressionLevel: 9 })
	.toBuffer();
const squareInput = path.join(temporaryDirectory, "logo-square.png");
const touchInput = path.join(temporaryDirectory, "apple-touch-icon.png");

try {
	await fs.writeFile(squareInput, square);
	await sharp(square).resize(180, 180).png({ compressionLevel: 9 }).toFile(touchInput);
	await Promise.all([
		run("cwebp", ["-quiet", "-q", "80", squareInput, "-o", path.join(brandDirectory, "logo-square.webp")]),
		run("cwebp", ["-quiet", "-q", "80", squareInput, "-o", path.join(brandDirectory, "logo-maskable.webp")]),
		run("cwebp", ["-quiet", "-q", "80", touchInput, "-o", path.join(root, "public/apple-touch-icon.webp")])
	]);
} finally {
	await fs.rm(temporaryDirectory, { recursive: true, force: true });
}

console.log("Generated the square logo, maskable icon, and Apple Touch Icon as WebP at quality 80.");
