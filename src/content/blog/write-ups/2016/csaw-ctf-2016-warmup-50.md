---
slug: csaw-ctf-2016-warmup-50
title: "[CSAW CTF 2016] warmup 50"
description: "[CSAW CTF 2016] warmup 50 解題紀錄，整理題目分析、漏洞成因、利用方式與解題流程。"
pubDate: "2016-09-19"
authors:
  - nae
category: Write-up
tags:
  - CSAW CTF 2016
  - pwn
  - overflow
featured: false
coverTone: night
language: zh-Hant
legacy: true
legacySource: https://github.com/bamboofox/bamboofox-blog-old/blob/master/_posts/2016-09-19-CSAW-CTF-2016-warmup-50.md
legacyPath: "/write-ups/2016/09/19/CSAW-CTF-2016-warmup-50.html"
---

> Category: pwn Point: 50 Solver: nae @ BambooFox

和藹可親的 warmup

64 bit ELF NX, Partial RELRO, no canary, no PIE

這題就簡單的 `stack overflow` 量一下 offset，他有一個 function 會直接 `system('cat flag.txt')`，在 ret address 的地方蓋成那個 function 就可以拿 flag。
