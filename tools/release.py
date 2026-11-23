#!/usr/bin/env python3
"""零號病例：升版工具（Claude、GPT 共用，2026-11-23 起）
用法（在倉庫根目錄）：python3 tools/release.py patch|minor|major
  patch：修正、數值、文字　minor：新系統、新內容　major：存檔不相容、整體架構改變
會做的事（只改 index.html）：
  1. ZC_VER 的版本照等級加一、Build 加一、時間寫現在（Asia/Taipei）
  2. 兩處 fonts/tw-kai-game.woff2?v= 換成目前字型檔 SHA-256 的前 8 碼（字型沒變就不會變）
  3. 印出新版本、Build、時間和 index.html 的 SHA-256（回報、更新說明用這個）
不會做的事：不寫 CHANGELOG、不產生 SHA 清單、不動其他檔案。"""
import sys,re,json,hashlib,datetime,pathlib
lvl=sys.argv[1] if len(sys.argv)>1 else ''
assert lvl in ('patch','minor','major'),__doc__
root=pathlib.Path(__file__).resolve().parent.parent
p=root/'index.html';s=p.read_text(encoding='utf-8')
m=re.search(r'^const ZC_VER=(\{.*?\});$',s,re.M);assert m,'找不到 ZC_VER'
old=json.loads(m.group(1));a=[int(x) for x in old['v'].split('.')]
v={'patch':[a[0],a[1],a[2]+1],'minor':[a[0],a[1]+1,0],'major':[a[0]+1,0,0]}[lvl]
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).replace(microsecond=0).isoformat()
new={'v':'.'.join(map(str,v)),'b':old['b']+1,'t':now}
s=s[:m.start()]+'const ZC_VER='+json.dumps(new,ensure_ascii=False)+';'+s[m.end():]
font=hashlib.sha256((root/'fonts/tw-kai-game.woff2').read_bytes()).hexdigest()[:8]
s,n=re.subn(r'fonts/tw-kai-game\.woff2\?v=[0-9a-f]{8}','fonts/tw-kai-game.woff2?v='+font,s)
assert n==2,f'字型網址應該有 2 處，找到 {n} 處'
p.write_text(s,encoding='utf-8')
print(f"v{old['v']}／Build {old['b']} → v{new['v']}／Build {new['b']}　{now}（Asia/Taipei）")
print('字型 ?v=',font)
print('index.html SHA-256',hashlib.sha256(p.read_bytes()).hexdigest())
