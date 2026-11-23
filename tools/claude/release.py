#!/usr/bin/env python3
"""零號病例（文字版）發布工具
用法：
  python3 release.py init  "標題" notes.md   # 只用在第一版 v0.0.1
  python3 release.py patch "標題" notes.md   # 修正、數值調整、文字修改
  python3 release.py minor "標題" notes.md   # 新系統、新內容、新章節
  python3 release.py major "標題" notes.md   # 存檔不相容、整體架構改變
notes.md：這一版的變更內容，一行一點（Markdown 條列）。
會做的事：版本號與 Build 加一、記錄發布時間（Asia/Taipei）與上一版、重新建置、
產生 SHA-256 清單、把這一版寫到 CHANGELOG.md 最上面。
"""
import sys,json,hashlib,subprocess,os,datetime,glob
ROOT=os.path.dirname(os.path.abspath(__file__));os.chdir(ROOT)
SRC=['head.html','items.js','chars.js','story.js','story2.js','story3.js','story4.js','engine_a.js','engine_b.js','engine_c.js','engine_d.js','qte.js','net.js','ui.js','scr.js','build.sh','release.py','mock.js','bot.js','mp.js']
def sha(p):return hashlib.sha256(open(p,'rb').read()).hexdigest()
lvl,title,notes=sys.argv[1],sys.argv[2],open(sys.argv[3],encoding='utf-8').read().strip()
ID='RELEASE_IDENTITY.json'
old=json.load(open(ID,encoding='utf-8')) if os.path.exists(ID) else None
if lvl=='init':
    assert old is None,'已經有版本了，不能再 init'
    ver,build,parent=[0,0,1],1,None
else:
    a=[int(x) for x in old['version'].split('.')]
    ver={'patch':[a[0],a[1],a[2]+1],'minor':[a[0],a[1]+1,0],'major':[a[0]+1,0,0]}[lvl]
    build=old['build']+1
    parent={'version':old['version'],'build':old['build'],'released_at':old['released_at'],'html_sha256':old['release']['html_sha256']}
v='.'.join(map(str,ver))
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).replace(microsecond=0).isoformat()
ident={'schema_version':1,'project':'ZeroCase-Text','title':title,'version':v,'build':build,'level':lvl,'released_at':now,'timezone':'Asia/Taipei','parent':parent,'release':{}}
json.dump(ident,open(ID,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
r=subprocess.run(['bash','build.sh'],capture_output=True,text=True);print(r.stdout.strip())
assert 'syntax ok' in r.stdout,'建置失敗，沒有發布'
files=SRC+['zerocase.html']+sorted(glob.glob('img/*'))
sums=''.join(f'{sha(f)}  {f}\n' for f in files)
sp=f'history/sha/SHA256SUMS_v{v}.txt';open(sp,'w').write(sums)
open(sp+'.sha256','w').write(f'{sha(sp)}  {os.path.basename(sp)}\n')
ident['release']={'html':'zerocase.html','html_bytes':os.path.getsize('zerocase.html'),'html_sha256':sha('zerocase.html'),'sums':sp,'sums_sha256':sha(sp),'files':len(files)}
json.dump(ident,open(ID,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
par=f"v{parent['version']}／Build {parent['build']}（{parent['released_at']}）" if parent else '無（第一版）'
entry=f"""## v{v}｜{title}

- 版本：v{v}／Build {build}　類型：{ {'init':'初版','patch':'PATCH','minor':'MINOR','major':'MAJOR'}[lvl] }
- 發布時間：{now}（Asia/Taipei）
- 上一版：{par}
- zerocase.html：{ident['release']['html_bytes']} bytes，SHA-256 `{ident['release']['html_sha256']}`
- 檔案清單：`{sp}`（{len(files)} 個檔案），清單本身 SHA-256 `{ident['release']['sums_sha256']}`

{notes}
"""
CL='CHANGELOG.md';head='# 零號病例（文字冒險版）開發紀錄\n\n最新的在最上面。每一版的完整檔案雜湊在 history/sha/。\n\n'
body=open(CL,encoding='utf-8').read().split('\n\n',2)[2] if os.path.exists(CL) else ''
open(CL,'w',encoding='utf-8').write(head+entry+('\n'+body if body else ''))
print(f'發布 v{v}／Build {build}  {now}\n  html sha256 {ident["release"]["html_sha256"]}')
