#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { CTF_TEAMS, SITE_DESCRIPTION, SITE_TITLE } from "../src/consts.js";
import { legacyRedirects } from "../src/data/legacyRedirects.js";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const site = "https://bamboofox.org";
const failures = [];

const fail = message => failures.push(message);
const assert = (condition, message) => {
	if (!condition) fail(message);
};

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(entry => {
			const target = path.join(directory, entry.name);
			return entry.isDirectory() ? walk(target) : [target];
		})
	);
	return nested.flat();
}

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
const decodeHTML = value =>
	value
		?.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
		.replaceAll("&quot;", '"')
		.replaceAll("&apos;", "'")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&amp;", "&");
const tagWith = (html, tagName, name, value) => [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map(match => match[0]).find(tag => attr(tag, name) === value);
const meta = (html, key) => {
	const tag = tagWith(html, "meta", "name", key) || tagWith(html, "meta", "property", key);
	return tag ? attr(tag, "content") : undefined;
};
const link = (html, rel) => {
	const tag = tagWith(html, "link", "rel", rel);
	return tag ? attr(tag, "href") : undefined;
};
const schemas = html =>
	[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((match, index) => {
		try {
			return JSON.parse(match[1]);
		} catch (error) {
			fail(`invalid JSON-LD block ${index + 1}: ${error.message}`);
			return null;
		}
	});
const hasType = (schema, type) => (Array.isArray(schema?.["@type"]) ? schema["@type"].includes(type) : schema?.["@type"] === type);

function routeFor(file) {
	const relative = path.relative(dist, file).split(path.sep).join("/");
	if (relative === "index.html") return "/";
	return `/${relative.replace(/index\.html$/, "")}`;
}

await access(dist).catch(() => {
	console.error("dist/ does not exist. Run `pnpm build` before `pnpm seo:check`.");
	process.exit(1);
});

const allFiles = await walk(dist);
const htmlFiles = allFiles.filter(file => file.endsWith(".html"));
const indexableFiles = htmlFiles.filter(file => path.basename(file) === "index.html");
const blogDirectory = path.join(root, "src/content/blog");
const authorsDirectory = path.join(root, "src/content/authors");
const sourcePosts = (await walk(blogDirectory)).filter(file => /\.mdx?$/.test(file));
const sourceAuthors = (await readdir(authorsDirectory)).filter(file => file.endsWith(".json"));
const articleFiles = indexableFiles.filter(file => {
	const relative = path.relative(dist, file).split(path.sep).join("/");
	return relative.startsWith("blog/") && relative !== "blog/index.html";
});
const authorFiles = indexableFiles.filter(file => {
	const relative = path.relative(dist, file).split(path.sep).join("/");
	return relative.startsWith("authors/") && relative !== "authors/index.html";
});

assert(articleFiles.length === sourcePosts.length, `expected ${sourcePosts.length} built articles, found ${articleFiles.length}`);
assert(authorFiles.length === sourceAuthors.length, `expected ${sourceAuthors.length} author profiles, found ${authorFiles.length}`);

const canonicalRoutes = new Map();
for (const file of indexableFiles) {
	const route = routeFor(file);
	const html = await readFile(file, "utf8");
	const context = route === "/" ? "home" : route;
	const canonical = link(html, "canonical");
	const expectedCanonical = new URL(route, site).href;

	assert((html.match(/<title>/g) || []).length === 1, `${context}: expected one title`);
	assert(Boolean(html.match(/<title>[^<]+<\/title>/)), `${context}: title is empty`);
	assert(Boolean(meta(html, "description")), `${context}: missing description`);
	assert(meta(html, "robots")?.startsWith("index, follow"), `${context}: page is not indexable`);
	assert(canonical === expectedCanonical, `${context}: canonical is ${canonical || "missing"}, expected ${expectedCanonical}`);
	assert(meta(html, "og:url") === canonical, `${context}: og:url does not match canonical`);
	assert(decodeHTML(meta(html, "og:title")) === decodeHTML(html.match(/<title>([^<]+)<\/title>/)?.[1]), `${context}: og:title does not match title`);
	assert(Boolean(meta(html, "og:description")), `${context}: missing og:description`);
	assert(meta(html, "og:image")?.startsWith(`${site}/`), `${context}: missing first-party Open Graph image`);
	assert(meta(html, "og:image:type") === "image/webp", `${context}: Open Graph image type is not WebP`);
	assert(meta(html, "og:image:width") === "512" && meta(html, "og:image:height") === "512", `${context}: Open Graph dimensions are not 512x512`);
	assert(Boolean(meta(html, "og:image:alt")), `${context}: missing Open Graph image alt`);
	assert(meta(html, "twitter:card") === "summary", `${context}: Twitter card is not summary`);
	assert(meta(html, "twitter:image") === meta(html, "og:image"), `${context}: Twitter and Open Graph images differ`);
	assert(Boolean(meta(html, "twitter:image:alt")), `${context}: missing Twitter image alt`);
	assert((html.match(/<h1(?:\s|>)/g) || []).length === 1, `${context}: expected exactly one H1`);

	if (canonical) {
		if (canonicalRoutes.has(canonical)) fail(`${context}: duplicate canonical also used by ${canonicalRoutes.get(canonical)}`);
		canonicalRoutes.set(canonical, context);
	}

	const pageSchemas = schemas(html).filter(Boolean);
	if (route === "/") {
		assert(decodeHTML(html.match(/<title>([^<]+)<\/title>/)?.[1]) === SITE_TITLE, `home: title does not match ${SITE_TITLE}`);
		assert(decodeHTML(meta(html, "description")) === SITE_DESCRIPTION, "home: description does not match the official introduction");
		const organization = pageSchemas.find(schema => hasType(schema, "Organization"));
		const website = pageSchemas.find(schema => hasType(schema, "WebSite"));
		assert(Boolean(organization), "home: missing Organization JSON-LD");
		assert(Boolean(website), "home: missing WebSite JSON-LD");
		assert(organization?.name === SITE_TITLE, "home: Organization name does not match the site title");
		assert(organization?.description === SITE_DESCRIPTION, "home: Organization description is outdated");
		assert(organization?.sameAs?.includes(CTF_TEAMS.BambooFox), "home: Organization is missing the BambooFox CTFtime profile");
		assert(website?.name === SITE_TITLE, "home: WebSite name does not match the site title");
		assert(website?.description === SITE_DESCRIPTION, "home: WebSite description is outdated");
	}
	if (route === "/blog/") {
		assert(
			pageSchemas.some(schema => hasType(schema, "Blog") && hasType(schema, "CollectionPage")),
			"blog: missing Blog/CollectionPage JSON-LD"
		);
		assert(
			pageSchemas.some(schema => hasType(schema, "BreadcrumbList")),
			"blog: missing BreadcrumbList JSON-LD"
		);
	}
}

for (const file of articleFiles) {
	const route = routeFor(file);
	const html = await readFile(file, "utf8");
	const article = schemas(html).find(schema => hasType(schema, "BlogPosting"));
	assert(Boolean(article), `${route}: missing BlogPosting JSON-LD`);
	assert(Boolean(article?.headline && article?.description), `${route}: incomplete BlogPosting headline or description`);
	assert(/^\d{4}-\d{2}-\d{2}$/.test(article?.datePublished || ""), `${route}: datePublished must be a calendar date`);
	assert(/^\d{4}-\d{2}-\d{2}$/.test(article?.dateModified || ""), `${route}: dateModified must be a calendar date`);
	assert(Array.isArray(article?.author) && article.author.length > 0, `${route}: missing structured authors`);
	assert(
		schemas(html).some(schema => hasType(schema, "BreadcrumbList")),
		`${route}: missing BreadcrumbList JSON-LD`
	);
	assert(/<a\b[^>]*rel="author"/.test(html), `${route}: missing visible author link`);
	assert(meta(html, "og:type") === "article", `${route}: og:type is not article`);
	assert(/^\d{4}-\d{2}-\d{2}$/.test(meta(html, "article:published_time") || ""), `${route}: article:published_time must be a calendar date`);
}

for (const file of authorFiles) {
	const route = routeFor(file);
	const html = await readFile(file, "utf8");
	const profile = schemas(html).find(schema => hasType(schema, "ProfilePage"));
	assert(Boolean(profile), `${route}: missing ProfilePage JSON-LD`);
	assert(profile?.mainEntity?.image?.endsWith(".webp"), `${route}: ProfilePage is missing its WebP avatar`);
	assert(/<img\b[^>]*src="\/authors\/[a-z0-9-]+\.webp"/.test(html), `${route}: missing visible WebP avatar`);
	assert(
		schemas(html).some(schema => hasType(schema, "BreadcrumbList")),
		`${route}: missing BreadcrumbList JSON-LD`
	);
}

const sitemapFiles = allFiles.filter(file => /sitemap-\d+\.xml$/.test(file));
const sitemapLocations = new Set();
for (const file of sitemapFiles) {
	const xml = await readFile(file, "utf8");
	for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapLocations.add(match[1]);
}
assert(sitemapFiles.length > 0, "missing generated sitemap URL set");
assert(
	[...sitemapLocations].every(url => !url.endsWith(".html") && !url.includes("/404")),
	"sitemap contains a legacy redirect or 404 URL"
);
const canonicalSet = new Set(canonicalRoutes.keys());
for (const canonical of canonicalSet) assert(sitemapLocations.has(canonical), `sitemap is missing ${canonical}`);
for (const location of sitemapLocations) assert(canonicalSet.has(location), `sitemap contains unexpected URL ${location}`);

const rss = await readFile(path.join(dist, "rss.xml"), "utf8");
const rssItems = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1]);
assert(rssItems.length === sourcePosts.length, `RSS has ${rssItems.length} items; expected ${sourcePosts.length}`);
assert(
	rssItems.every(item => /<dc:creator>[^<]+<\/dc:creator>/.test(item)),
	"RSS item is missing dc:creator"
);
const rssDates = rssItems.map(item => Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] || ""));
assert(
	rssDates.every((date, index) => index === 0 || rssDates[index - 1] >= date),
	"RSS items are not sorted newest first"
);

const legacyEntries = Object.entries(legacyRedirects);
assert(legacyEntries.length === 40, `expected 40 legacy URL mappings, found ${legacyEntries.length}`);
for (const [source, destination] of legacyEntries) {
	const file = path.join(dist, source.replace(/^\//, ""));
	const html = await readFile(file, "utf8").catch(() => "");
	assert(Boolean(html), `legacy URL was not built: ${source}`);
	assert(meta(html, "robots") === "noindex, follow", `${source}: legacy page must be noindex, follow`);
	assert(link(html, "canonical") === new URL(destination, site).href, `${source}: legacy canonical does not point to ${destination}`);
	assert(html.includes(`content="0;url=${destination}"`), `${source}: legacy page does not refresh to ${destination}`);
}

for (const name of ["logo-square", "logo-maskable"]) {
	const metadata = await sharp(path.join(root, `public/brand/${name}.webp`)).metadata();
	assert(metadata.width === 512 && metadata.height === 512 && metadata.format === "webp", `${name} is not a 512x512 WebP`);
}
const touchIcon = await sharp(path.join(root, "public/apple-touch-icon.webp")).metadata();
assert(touchIcon.width === 180 && touchIcon.height === 180 && touchIcon.format === "webp", "Apple Touch Icon is not a 180x180 WebP");

const publicRasterFiles = (await walk(path.join(root, "public"))).filter(file => /\.(?:png|jpe?g|gif|avif)$/i.test(file));
assert(publicRasterFiles.length === 0, `public contains non-WebP raster images: ${publicRasterFiles.map(file => path.relative(root, file)).join(", ")}`);

const slugs = new Set();
const markdown = await Promise.all(
	sourcePosts.map(async file => {
		const relative = path.relative(blogDirectory, file).split(path.sep).join("/");
		assert(/^(?:articles|courses|write-ups)\/\d{4}\/[a-z0-9-]+\.mdx?$|^rules\/[a-z0-9-]+\.mdx?$/.test(relative), `article is outside the maintained category/year layout: ${relative}`);
		const content = await readFile(file, "utf8");
		const slug = content.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
		assert(Boolean(slug), `${relative}: missing valid slug`);
		assert(path.basename(file).replace(/\.mdx?$/, "") === slug, `${relative}: filename does not match slug ${slug}`);
		assert(!slugs.has(slug), `${relative}: duplicate slug ${slug}`);
		if (slug) slugs.add(slug);
		return content;
	})
);
assert(
	markdown.every(content => !content.includes("i.imgur.com")),
	"article content still hotlinks an Imgur image"
);
for (const content of markdown) {
	for (const match of content.matchAll(/\]\((\/blog\/legacy-images\/[^)\s]+)\)/g)) {
		assert(match[1].endsWith(".webp"), `legacy article image is not WebP: ${match[1]}`);
		await access(path.join(root, "public", match[1])).catch(() => fail(`missing local article image ${match[1]}`));
	}
}

for (const file of sourceAuthors) {
	const author = JSON.parse(await readFile(path.join(authorsDirectory, file), "utf8"));
	assert(/^\/authors\/[a-z0-9-]+\.webp$/.test(author.avatar), `${file}: invalid WebP avatar path`);
	const metadata = await sharp(path.join(root, "public", author.avatar)).metadata();
	assert(metadata.format === "webp", `${file}: avatar is not WebP`);
	assert(metadata.width <= 256, `${file}: avatar exceeds the 256px maximum width`);
}

const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
assert(robots.includes(`Sitemap: ${site}/sitemap-index.xml`), "robots.txt is missing the production sitemap URL");
const manifest = JSON.parse(await readFile(path.join(dist, "site.webmanifest"), "utf8"));
assert(manifest.name === SITE_TITLE, "web manifest name does not match the site title");
assert(manifest.description === SITE_DESCRIPTION, "web manifest description is outdated");

if (failures.length > 0) {
	console.error(`SEO check failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`SEO check passed: ${indexableFiles.length} indexable pages, ${articleFiles.length} articles, ${authorFiles.length} author profiles, ${legacyEntries.length} legacy URLs.`);
