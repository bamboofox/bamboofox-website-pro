import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const authors = defineCollection({
	loader: glob({ base: "./src/content/authors", pattern: "**/*.json" }),
	schema: z.object({
		name: z.string(),
		handle: z.string().optional(),
		type: z.enum(["Person", "Organization"]).default("Person"),
		github: z.string().url().optional(),
		avatar: z.string().regex(/^\/authors\/[a-z0-9-]+\.webp$/),
		description: z.string()
	})
});

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		authors: z.array(reference("authors")).min(1),
		category: z.enum(["規章", "文章", "教學", "Write-up"]),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		coverTone: z.enum(["fern", "amber", "mist", "night"]).default("fern"),
		image: z.string().optional(),
		language: z.enum(["zh-Hant", "en"]).default("zh-Hant"),
		legacy: z.boolean().default(false),
		legacySource: z.string().url().optional(),
		legacyPath: z.string().optional()
	})
});

export const collections = { authors, blog };
