#!/usr/bin/env ruby

require "date"
require "fileutils"
require "open3"
require "yaml"

ROOT = File.expand_path("..", __dir__)
OLD_REPO = File.join(ROOT, "bamboofox-blog-old")
SOURCE_DIR = File.join(OLD_REPO, "_posts")
DEST_DIR = File.join(ROOT, "src/content/blog")
REDIRECTS_FILE = File.join(ROOT, "src/data/legacyRedirects.js")

AUTHOR_ALIASES = {
  "0Alien0" => "oalieno",
  "oalieno" => "oalieno",
  "OAlienO" => "oalieno",
  "bananaapple" => "bananaapple",
  "bruce30262" => "bruce30262",
  "nae" => "nae",
  "Naetw" => "naetw",
  "briansp8210" => "briansp8210",
  "BambooFox" => "bamboofox-team",
  "djosix" => "djosix",
  "zeze" => "zeze",
  "lys0829" => "lys0829",
  "billy" => "billy",
  "seadog007" => "seadog007",
  "frozenkp" => "frozenkp",
  "ss8650twtw" => "ss8650twtw"
}.freeze

MISSING_AUTHORS = {
  "2016-07-22-hitconCMTChallenge.md" => ["bamboofox-team"],
  "2017-08-27-HITCON-CMT-2017.md" => ["oalieno"],
  "2017-09-28-106-club-course.md" => ["oalieno", "a0919610611", "frozenkp"],
  "2018-10-31-2018-club-courses.md" => ["oalieno", "si-chen-lin", "yi-hsien-chen"]
}.freeze

SLUG_OVERRIDES = {
  "2016-07-22-hitconCMTChallenge.md" => "hitcon-cmt-challenge",
  "2017-05-03-DEFCON-CTF-2017-Quals-peROPdo.md" => "defcon-ctf-2017-quals-peropdo"
}.freeze

UPDATED_DATES = {
  "2017-09-28-106-club-course.md" => "2018-03-20",
  "2018-10-31-2018-club-courses.md" => "2018-11-28"
}.freeze

TAG_ALIASES = {
  "Crypto" => "crypto",
  "Forensic" => "forensics",
  "Misc" => "misc",
  "Reverse" => "reverse",
  "Unlink" => "unlink",
  "Use After Free" => "use-after-free",
  "loca root" => "local root",
  "pdflatext" => "pdflatex"
}.freeze

def split_document(text)
  match = text.match(/\A---\s*\n(.*?)\n---\s*\n?/m)
  raise "Missing frontmatter" unless match

  data = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
  [data, text[match.end(0)..] || ""]
end

def slug_for(filename)
  return SLUG_OVERRIDES.fetch(filename) if SLUG_OVERRIDES.key?(filename)

  filename
    .sub(/\A\d{4}-\d{2}-\d{2}-/, "")
    .sub(/\.md\z/, "")
    .downcase
    .gsub(/[^a-z0-9]+/, "-")
    .gsub(/\A-|\z/, "")
end

def date_for(data, filename)
  raw = data["date"] || filename[0, 10]
  Date.parse(raw.to_s).iso8601
end

def authors_for(data, filename)
  return MISSING_AUTHORS.fetch(filename) if MISSING_AUTHORS.key?(filename)

  raw = data["authors"] || data["author"]
  Array(raw)
    .flat_map { |author| author.to_s.split(",") }
    .map(&:strip)
    .reject(&:empty?)
    .map { |author| AUTHOR_ALIASES.fetch(author) { raise "Unknown author #{author.inspect} in #{filename}" } }
    .uniq
end

def tags_for(data, filename)
  tags = Array(data["tags"]) + Array(data["related_technique"])
  tags = ["HITCON CMT", "社群活動"] if filename == "2016-07-22-hitconCMTChallenge.md"
  tags = ["InCTF 2020", "crypto", "web", "network pentest"] if filename == "2020-08-03-inctf-2020-write-up.md"
  tags.map { |tag| TAG_ALIASES.fetch(tag.to_s, tag.to_s) }.map(&:strip).reject(&:empty?).uniq
end

def category_for(data, filename)
  return "文章" if filename == "2017-03-20-Synology-Bug-Bounty-2016.md"

  categories = Array(data["categories"]).map(&:to_s)
  return "Write-up" if categories.include?("write-ups")
  return "教學" if categories.include?("tutorial")

  "文章"
end

def description_for(title, category, filename)
  case filename
  when "2017-03-20-Synology-Bug-Bounty-2016.md"
    "BambooFox Team 公開的 Synology Bug Bounty 2016 研究報告，記錄驗證繞過、遠端程式碼執行、任意檔案讀寫、權限提升與阻斷服務等漏洞。"
  when "2016-07-22-hitconCMTChallenge.md"
    "BambooFox 在 HITCON CMT 社群攤位提供的現場挑戰、題目 repository 與活動資訊。"
  when "2017-08-27-HITCON-CMT-2017.md"
    "HITCON CMT 2017 BambooFox 社群議程投影片與現場闖關題目的解題紀錄。"
  when "2020-08-03-inctf-2020-write-up.md"
    "InCTF 2020 Crypto、Web 與 Network Pentest 題目的分析與解題紀錄。"
  else
    if category == "教學"
      "BambooFox #{title} 的課程時程、教材、錄影與相關資源整理。"
    elsif category == "Write-up"
      "#{title} 解題紀錄，整理題目分析、漏洞成因、利用方式與解題流程。"
    else
      "#{title} 的 BambooFox 舊站活動與技術資料。"
    end
  end
end

def normalize_body(body, title, filename)
  body = body.gsub("<!-- more -->", "")
  body = body.gsub("```=", "```text").gsub(/```(python|c)=/, '```\\1')
  body = body.gsub("```::shell", "```shell").gsub(/```::python=?/, "```python")
  body = body.gsub("```assembly", "```asm").gsub("```python2", "```python").gsub("```python3", "```python")
  body = body.gsub("~~~assembly", "~~~asm")
  body = body.gsub(/^```C$/, "```c")
  body = body.gsub(/(!\[[^\]]*\]\()https:\/\/i\.imgur\.com\/([^\)\s]+)(\))/) do
    prefix = Regexp.last_match(1)
    source_filename = Regexp.last_match(2)
    suffix = Regexp.last_match(3)
    filename = source_filename.sub(/\.(?:png|jpe?g|gif)\z/i, ".webp")
    "#{prefix}/blog/legacy-images/#{filename}#{suffix}"
  end
  body = body.gsub(/!\[\]\(/, "![#{title} 文章附圖](")
  body = body.gsub("![hamming code](/img/hammingcode.png)", "> 原文的 Hamming code 圖片未保存在舊站 repository 中；以下保留原始文字說明。")

  if filename == "2017-03-20-Synology-Bug-Bounty-2016.md"
    body = body.gsub(/\]\(#([^)]+?)\s*\)/) { "](#" + Regexp.last_match(1).strip.downcase + ")" }
  end

  lines = body.lines
  first_content = lines.index { |line| !line.strip.empty? }
  if first_content && lines[first_content].start_with?("# ")
    heading = lines[first_content].sub(/\A#\s+/, "").strip.gsub(/\[([^\]]+)\]\([^\)]+\)/, '\\1')
    if heading.casecmp?(title)
      lines.delete_at(first_content)
    end
  end

  fence = nil
  lines.map! do |line|
    stripped = line.lstrip
    marker = stripped.start_with?("```") ? "```" : stripped.start_with?("~~~") ? "~~~" : nil

    if marker
      fence = fence.nil? ? marker : nil if fence.nil? || fence == marker
      next line
    end

    next line if fence

    # The page layout owns the single H1. Preserve old article headings as H2,
    # including Setext-style headings that use a line of equals signs.
    if line.start_with?("# ")
      line.sub(/\A# /, "## ")
    elsif line.strip.match?(/\A=+\z/)
      "#{"-" * [line.strip.length, 3].max}\n"
    else
      line
    end
  end
  lines.join.strip + "\n"
end

def legacy_path_for(data, filename, pub_date)
  categories = Array(data["categories"]).map(&:to_s).reject(&:empty?)
  stem = filename.sub(/\A\d{4}-\d{2}-\d{2}-/, "").sub(/\.md\z/, "")
  date_path = pub_date.tr("-", "/")
  "/#{(categories + [date_path, "#{stem}.html"]).join("/")}"
end

def source_url(filename, branch)
  "https://github.com/bamboofox/bamboofox-blog-old/blob/#{branch}/_posts/#{filename}"
end

def destination_path_for(category, pub_date, slug)
  section = {
    "Write-up" => "write-ups",
    "教學" => "courses",
    "文章" => "articles"
  }.fetch(category)

  File.join(DEST_DIR, section, pub_date[0, 4], "#{slug}.md")
end

def read_branch_post
  content, status = Open3.capture2("git", "-C", OLD_REPO, "show", "origin/inctf2020:_posts/2020-08-03-inctf-2020-write-up.md")
  raise "Unable to read origin/inctf2020 article" unless status.success?

  ["2020-08-03-inctf-2020-write-up.md", content, "inctf2020"]
end

FileUtils.mkdir_p(DEST_DIR)
FileUtils.mkdir_p(File.dirname(REDIRECTS_FILE))

documents = Dir[File.join(SOURCE_DIR, "*.md")].sort.map { |path| [File.basename(path), File.read(path), "master"] }
documents << read_branch_post
redirects = {}

documents.each do |filename, text, branch|
  data, body = split_document(text)
  slug = slug_for(filename)
  pub_date = date_for(data, filename)
  category = category_for(data, filename)
  authors = authors_for(data, filename)
  raise "No author for #{filename}" if authors.empty?

  frontmatter = {
    "slug" => slug,
    "title" => data.fetch("title").to_s,
    "description" => description_for(data.fetch("title").to_s, category, filename),
    "pubDate" => pub_date,
    "authors" => authors,
    "category" => category,
    "tags" => tags_for(data, filename),
    "featured" => false,
    "coverTone" => category == "Write-up" ? "night" : category == "教學" ? "fern" : "mist",
    "language" => ["2017-03-20-Synology-Bug-Bounty-2016.md", "2020-01-07-2019-bamboofox-ctf-official-write-up.md", "2020-08-03-inctf-2020-write-up.md"].include?(filename) ? "en" : "zh-Hant",
    "legacy" => true,
    "legacySource" => source_url(filename, branch),
    "legacyPath" => legacy_path_for(data, filename, pub_date)
  }
  frontmatter["updatedDate"] = UPDATED_DATES.fetch(filename) if UPDATED_DATES.key?(filename)

  yaml = YAML.dump(frontmatter, line_width: -1).sub(/\A---\s*\n/, "")
  output = "---\n#{yaml}---\n\n#{normalize_body(body, data.fetch("title").to_s, filename)}"
  destination_path = destination_path_for(category, pub_date, slug)
  FileUtils.mkdir_p(File.dirname(destination_path))
  FileUtils.rm_f(File.join(DEST_DIR, "#{slug}.md"))
  File.write(destination_path, output)
  redirects[frontmatter.fetch("legacyPath")] = "/blog/#{slug}/"
end

redirect_lines = redirects.sort.map { |from, to| "\t#{from.inspect}: #{to.inspect}" }
File.write(REDIRECTS_FILE, "// Generated by scripts/migrate-old-blog.rb.\nexport const legacyRedirects = {\n#{redirect_lines.join(",\n")}\n};\n")

puts "Migrated #{documents.length} legacy articles and generated #{redirects.length} redirects."
