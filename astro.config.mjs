import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://bamboofox.org",
	integrations: [mdx(), sitemap({ filter: page => !page.endsWith(".html") && !page.endsWith("/404/") })]
});
