# BambooFox website

BambooFox／交大網路安全策進會（NYCU Cyber Security Club）官網。以 Astro 7、JavaScript、Markdown 與 `phosphor-astro` 建置。

網站包含：

- 首頁與公開 Google Calendar 近期活動。
- 可依規章、文章、教學、Write-up 篩選的 Blog。
- 首頁內整合社群介紹、學習領域與 Discord／Instagram／Facebook 入口。
- RSS、Sitemap、Open Graph 與響應式版面。
- 作者頁、文章結構化資料與舊網址相容頁。

## Development

安裝套件：

```sh
pnpm install
```

依專案慣例，以背景模式啟動 Astro：

```sh
pnpm exec astro dev --background
pnpm exec astro dev status
pnpm exec astro dev logs
pnpm exec astro dev stop
```

建立 production 靜態網站：

```sh
pnpm build
pnpm seo:check
pnpm format:check
# 或一次執行完整檢查
pnpm check
```

## Content

Blog 文章放在 `src/content/blog/`，Frontmatter 由 `src/content.config.js` 驗證：

```text
src/content/blog/
├── rules/                    # 社群規章
├── articles/YYYY/            # 社群與技術文章
├── courses/YYYY/             # 課程與教學
└── write-ups/YYYY/           # CTF 與競賽 Write-up
```

文章檔名使用小寫 kebab-case，並與 `slug` 相同。公開網址只由 `slug` 決定，所以日後調整目錄不會改變文章 URL：

```yaml
---
slug: "article-slug"
title: "文章標題"
description: "文章摘要"
pubDate: "2026-07-21"
authors: ["your-author-id"] # 對應 src/content/authors/your-author-id.json
category: "教學" # 規章、文章、教學、Write-up
tags: ["CTF", "新手"]
featured: false
coverTone: "fern" # fern、amber、mist、night
---
```

作者資料放在 `src/content/authors/`。`authors` 使用作者檔名作為 ID，文章頁、作者頁、RSS 與 `BlogPosting` 結構化資料會共用同一份署名。作者頭像封存在 `public/authors/`；重新同步時需先安裝 `cwebp`，再執行：

```sh
pnpm avatars:sync
```

同步腳本會把 GitHub 頭像轉成最大寬度 256px、品質 80 的 WebP；沒有可確認 GitHub 帳號的作者暫用 GitHub 的通用頭像，不臆測個人身分。

## Legacy archive

舊站文章以 `bamboofox-blog-old/` 作為唯讀來源，遷移後的 Markdown 與舊網址對照表則保存在目前專案：

```sh
ruby scripts/migrate-old-blog.rb
node scripts/archive-old-blog-images.mjs
```

遷移器會保留舊文發布日期、作者、分類、標籤與來源連結，並產生對應的靜態相容頁。舊文章使用的 Imgur 圖片會封存到 `public/blog/legacy-images/`，避免外部圖片失效。

## Brand and SEO assets

`pnpm assets:brand` 會從官方 Logo SVG 產生 512 × 512 網站圖示與 Apple Touch Icon。網站不合成文章封面；沒有真實封面的頁面會使用正式品牌圖示作為社群分享 fallback。`pnpm seo:check` 會檢查建置後頁面的 canonical、社群分享標籤、JSON-LD、Sitemap、RSS、舊網址相容頁、文章目錄與作者頭像。

首頁會在 Astro 建置時讀取 BambooFox 公開 ICS；若來源暫時無法連線，頁面會顯示可前往 Google Calendar 的備援入口，而不會讓建置失敗。

## Brand assets

- `public/logo.svg`：BambooFox Logo／吉祥物。
- `public/bamboo.svg`：首頁主視覺的竹子圖層。
- `public/fox-wag.svg`：首頁主視覺的搖尾巴狐狸動畫圖層。

網站視覺以深綠、霧綠與狐狸橘為主，不使用陰影或網格背景。

## CI/CD

所有 branch push、pull request 與手動執行都會由 `.github/workflows/ci.yml` 安裝 frozen lockfile，執行格式檢查、production build 與 SEO 完整性檢查。`main` 通過同一組檢查後，`.github/workflows/deploy.yml` 會把 `dist/` 發布到 GitHub Pages。
