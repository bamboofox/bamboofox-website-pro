import { CLUB_NAME, CLUB_NAME_ZH, CTF_TEAMS, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SOCIAL_LINKS } from "../consts.js";

const toURL = (value, site) => new URL(value, site).href;
const toDateOnly = value => value.toISOString().slice(0, 10);

export function getOrganizationSchema(site) {
	const url = toURL("/", site);
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": `${url}#organization`,
		name: SITE_TITLE,
		alternateName: [SITE_NAME, CLUB_NAME_ZH, CLUB_NAME],
		url,
		logo: {
			"@type": "ImageObject",
			url: toURL("/brand/logo-square.webp", site),
			width: 512,
			height: 512
		},
		description: SITE_DESCRIPTION,
		email: SOCIAL_LINKS.email.replace("mailto:", ""),
		foundingDate: "2014",
		sameAs: [SOCIAL_LINKS.facebook, SOCIAL_LINKS.instagram, CTF_TEAMS.BambooFox],
		parentOrganization: {
			"@type": "CollegeOrUniversity",
			name: "國立陽明交通大學",
			alternateName: "National Yang Ming Chiao Tung University",
			url: "https://www.nycu.edu.tw/"
		}
	};
}

export function getWebsiteSchema(site) {
	const url = toURL("/", site);
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${url}#website`,
		url,
		name: SITE_TITLE,
		alternateName: [SITE_NAME, CLUB_NAME_ZH, CLUB_NAME],
		description: SITE_DESCRIPTION,
		inLanguage: "zh-Hant-TW",
		publisher: { "@id": `${url}#organization` }
	};
}

export function getBlogSchema(site, posts) {
	const url = toURL("/blog/", site);
	return {
		"@context": "https://schema.org",
		"@type": ["Blog", "CollectionPage"],
		"@id": `${url}#blog`,
		url,
		name: `${SITE_NAME} Blog`,
		description: "BambooFox 的社群規範、資安文章、教學與 CTF Write-up。",
		inLanguage: "zh-Hant-TW",
		publisher: { "@id": `${toURL("/", site)}#organization` },
		blogPost: posts.map(post => ({
			"@type": "BlogPosting",
			"@id": `${toURL(`/blog/${post.data.slug}/`, site)}#article`,
			headline: post.data.title,
			url: toURL(`/blog/${post.data.slug}/`, site),
			datePublished: toDateOnly(post.data.pubDate)
		}))
	};
}

export function getArticleSchemas({ site, slug, title, description, pubDate, updatedDate, category, tags, image, language, authors }) {
	const homeURL = toURL("/", site);
	const blogURL = toURL("/blog/", site);
	const articleURL = toURL(`/blog/${slug}/`, site);
	const authorItems = authors.map(author => ({
		"@type": author.data.type,
		name: author.data.name,
		url: toURL(`/authors/${author.id}/`, site)
	}));

	return [
		{
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			"@id": `${articleURL}#article`,
			mainEntityOfPage: { "@type": "WebPage", "@id": articleURL },
			headline: title,
			description,
			...(image ? { image: [toURL(image, site)] } : {}),
			datePublished: toDateOnly(pubDate),
			dateModified: toDateOnly(updatedDate || pubDate),
			author: authorItems,
			publisher: { "@id": `${homeURL}#organization` },
			articleSection: category,
			keywords: tags,
			inLanguage: language,
			url: articleURL,
			isPartOf: { "@id": `${blogURL}#blog` }
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: SITE_NAME, item: homeURL },
				{ "@type": "ListItem", position: 2, name: "Blog", item: blogURL },
				{ "@type": "ListItem", position: 3, name: title, item: articleURL }
			]
		}
	];
}

export function getAuthorSchemas(site, author, posts) {
	const url = toURL(`/authors/${author.id}/`, site);
	return [
		{
			"@context": "https://schema.org",
			"@type": "ProfilePage",
			"@id": `${url}#profile`,
			url,
			name: `${author.data.name}｜${SITE_NAME} 作者`,
			description: author.data.description,
			mainEntity: {
				"@type": author.data.type,
				name: author.data.name,
				url,
				image: toURL(author.data.avatar, site),
				sameAs: author.data.github ? [author.data.github] : undefined
			},
			hasPart: posts.map(post => ({ "@type": "BlogPosting", "@id": `${toURL(`/blog/${post.data.slug}/`, site)}#article` }))
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: SITE_NAME, item: toURL("/", site) },
				{ "@type": "ListItem", position: 2, name: "作者", item: toURL("/authors/", site) },
				{ "@type": "ListItem", position: 3, name: author.data.name, item: url }
			]
		}
	];
}
