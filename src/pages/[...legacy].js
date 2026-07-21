import { legacyRedirects } from "../data/legacyRedirects.js";

export function getStaticPaths() {
	return Object.entries(legacyRedirects).map(([source, destination]) => ({
		params: { legacy: source.replace(/^\//, "") },
		props: { source, destination }
	}));
}

const escapeHTML = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function GET({ props, site }) {
	const { source, destination } = props;
	const canonicalURL = new URL(destination, site).href;
	const html = `<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0;url=${escapeHTML(destination)}">
  <link rel="canonical" href="${escapeHTML(canonicalURL)}">
  <title>文章已搬移｜BambooFox</title>
  <style>
    * { box-sizing: border-box; }
    body { display: grid; min-height: 100vh; place-items: center; margin: 0; background: #082f24; color: #fffdf4; font-family: system-ui, sans-serif; }
    main { width: min(680px, calc(100vw - 40px)); padding: 2rem; border: 1px solid rgba(238, 243, 216, .4); border-radius: 24px; }
    a { color: #ffc66e; font-weight: 800; }
    code { color: #d9ed9b; }
  </style>
</head>
<body>
  <main>
    <h1>文章已搬移</h1>
    <p>舊網址 <code>${escapeHTML(source)}</code> 已更新。</p>
    <p><a href="${escapeHTML(destination)}">前往新文章</a></p>
  </main>
</body>
</html>`;

	return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
