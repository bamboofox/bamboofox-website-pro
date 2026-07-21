import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts.js";

const escapeXML = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export async function GET(context) {
	const posts = (await getCollection("blog")).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const authors = await getCollection("authors");
	const authorsById = new Map(authors.map(author => [author.id, author]));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: { atom: "http://www.w3.org/2005/Atom", dc: "http://purl.org/dc/elements/1.1/" },
		customData: `<language>zh-TW</language><atom:link href="${new URL("/rss.xml", context.site).href}" rel="self" type="application/rss+xml" />`,
		items: posts.map(post => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: `/blog/${post.data.slug}/`,
			categories: [post.data.category, ...post.data.tags],
			customData:
				post.data.authors
					.map(reference => authorsById.get(reference.id))
					.filter(Boolean)
					.map(author => `<dc:creator>${escapeXML(author.data.name)}</dc:creator>`)
					.join("") + `<dc:language>${post.data.language === "en" ? "en" : "zh-Hant-TW"}</dc:language>`
		}))
	});
}
