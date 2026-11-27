#!/usr/bin/env python3
"""重建開發音效索引；不改遊戲、快取清單或音檔。需要 Python、Node 與 ffprobe。"""
from pathlib import Path
import argparse
import concurrent.futures
import csv
import hashlib
import io
import json
import subprocess
import sys
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / 'audio-library'
SUFFIXES = {'.mp3', '.ogg', '.wav', '.flac', '.aiff', '.aif', '.m4a'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path):
    proc = subprocess.run([
        'ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
        'stream=codec_name,sample_rate,channels,bits_per_sample,bits_per_raw_sample:format=duration',
        '-of', 'json', str(path)
    ], check=True, capture_output=True, text=True)
    data = json.loads(proc.stdout)
    stream = data['streams'][0]
    return dict(codec=stream['codec_name'], sample_rate_hz=int(stream['sample_rate']),
                channels=stream['channels'],
                bit_depth=int(stream.get('bits_per_raw_sample') or stream.get('bits_per_sample') or 0) or None,
                duration_seconds=round(float(data['format']['duration']), 6))


def legacy_source(stem):
    """只轉錄既有證據，不把舊署名當成本次重新驗證的授權。"""
    doc = 'docs/audio/LICENSES_AND_ORIGINS.md'
    mapping = {
        'glassbreak': ('RangoAnimations', '613879', 'CC0'),
        'firealarm': ('simonjeffery13', '792484', 'CC0'),
        'genstart': ('jameswrowles', '516759', 'CC0'),
        'genloop': ('jameswrowles', '516759', 'CC0'),
        'dryfire': ('serøutōnin--deprivəd', '674568', 'CC0'),
        'woodknock': ('RoyalRose', '560295', 'CC0'),
        'woodimpact': ('qubodup', '160213', 'CC0'),
        'glassstep': ('LukaCafuka', '757830', 'CC0'),
        'waterpipe': ('HenKonen', '797674', 'CC0'),
        'waterpump': ('unfa', '221551', 'CC0'),
        'pumpstop': ('unfa', '221551', 'CC0'),
        'radiostatic': ('harrisonlace', '812929', 'CC0'),
        'piercehit': ('-GeorgeDiamond-', '718259', 'CC BY 4.0'),
        'crossbowshot': ('Erdie', '65734', 'CC BY 4.0'),
        'sgpump': ('TotallyPhilip', '755495', 'CC0'),
        'sgshell': ('AugustSandberg', '508746', 'CC0'),
        'sgshellbr': ('DrinkingWindGames', '789642', 'CC BY 4.0'),
        'sgopen': ('sentryx86', '52202', 'CC0'),
        'sgclose': ('sentryx86', '52202', 'CC0'),
        'revopen': ('o_ciz', '475420', 'CC0'),
        'revshell': ('Guy_Personface', '795317', 'CC0'),
        'revclose': ('AugustSandberg', '508744', 'CC0'),
        'm500': ('dcsimon', '139979', 'CC BY 3.0'),
    }
    if stem in mapping:
        author, sid, license_name = mapping[stem]
        from urllib.parse import quote
        return dict(author=author, source_url=f'https://freesound.org/people/{quote(author)}/sounds/{sid}/',
                    license=license_name, source_evidence=doc, rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem.startswith('radio') and stem[5:].isdigit():
        return dict(author='VoiceBosch', source_url='https://voicebosch.itch.io/radio-soldier-announcer-audio-pack',
                    license='CC BY-SA 4.0（專案衍生音檔）', source_evidence=doc,
                    rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem in ('rain_indoor_loop', 'rain_outdoor_loop', 'thunder_distant_01', 'thunder_distant_02'):
        indoor = stem == 'rain_indoor_loop'
        return dict(author='hchiurciu' if indoor else 'nwkstudios',
                    source_url=f'https://freesound.org/people/{"hchiurciu/sounds/147911" if indoor else "nwkstudios/sounds/564464"}/',
                    license='CC0 1.0', source_evidence='docs/audio/RAIN_SOURCE_MANIFEST.json',
                    rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem.startswith('bgm_hitman_'):
        return dict(author='Kevin MacLeod', source_url='https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1300013',
                    license='CC BY 4.0（分段改作）', source_evidence=doc, rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem in ('bgm_encounter', 'bgm_battle'):
        return dict(author='Matthew Pablo', source_url='https://opengameart.org/content/imminent-threat',
                    license='CC BY-SA 3.0（混音改作）', source_evidence=doc, rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem == 'bowdraw':
        return dict(author='Paveroux／JoeDinesSound',
                    source_urls=['https://freesound.org/people/Paveroux/sounds/490556/', 'https://freesound.org/people/JoeDinesSound/sounds/534941/'],
                    license='CC0（兩段混音）', source_evidence='docs/audio/BOW_SOURCE_MANIFEST.json',
                    rights_status='沿用既有紀錄；本次未重新查核原頁')
    if stem == 'bowimpact':
        return dict(author='Mixkit', source_url='https://mixkit.co/free-sound-effects/game/',
                    license='Mixkit Sound Effects Free License；不可當獨立素材再散布',
                    source_evidence='docs/audio/BOW_SOURCE_MANIFEST.json',
                    rights_status='既有遊戲用檔；不另複製或授權為通用素材')
    if stem in ('pumpmix', 'reveject'):
        authors = ['unfa', 'HenKonen'] if stem == 'pumpmix' else ['o_ciz', 'Yin_Yang_Jake007']
        ids = ['221551', '797674'] if stem == 'pumpmix' else ['475420', '406091']
        return dict(author='／'.join(authors), source_urls=[f'https://freesound.org/people/{a}/sounds/{i}/' for a, i in zip(authors, ids)],
                    license='CC0（混音改作）', source_evidence=doc, rights_status='沿用既有紀錄；本次未重新查核原頁')
    # 舊 Credits 只有作品／作者，尚無逐檔來源網址的部分，不猜測配對。
    return dict(author='待查核', source_url=None, license='待查核；不得視為新素材取用許可',
                source_evidence='index.html：CREDITS；docs/audio/ 舊紀錄',
                rights_status='既有遊戲用檔；來源或逐檔配對不完整，保留原狀並標示缺口')


def game_facts():
    code = """
const fs=require('fs');
const {build}=require('./tests/helpers/sfx-map.cjs');
const {scan}=require('./tests/helpers/assets.cjs');
const {load}=require('./tests/helpers/game-vm.cjs');
const g=load(),b=build(),a=scan();
console.log(JSON.stringify({version:JSON.parse(b.version),rows:b.rows,
 referenced:a.files,assetIndex:g.run('ZC_ASSET_INDEX.map(x=>x.url)'),
 globals:{sfiles:g.run('SFILES.slice()'),synth:g.run('Object.keys(SYN)'),cues:g.run('Object.keys(SCUE)')}}));
"""
    return json.loads(subprocess.run(['node', '-e', code], cwd=ROOT, check=True,
                                     capture_output=True, text=True).stdout)


def render():
    imports = json.loads((LIB / 'imports.json').read_text())
    facts = game_facts()
    facts_rows = {r['k']: r for r in facts['rows']}
    used = set(facts['referenced']) | set(facts['assetIndex'])
    rows = []

    def existing(p):
        rel = p.relative_to(ROOT).as_posix()
        stem = p.stem
        f = facts_rows.get(stem, {})
        return dict(id='existing:' + rel, group='existing', original_path=rel,
                    repository_path=rel, category=f.get('cat') or ('配樂' if stem.startswith('bgm') else '既有備用音效'),
                    description=f.get('desc') or stem,
                    use_status='目前程式引用' if rel in used else '倉庫既有備用；目前載入清單未引用',
                    usage_locations=f.get('where', []), availability='既有檔案；保留原路徑',
                    bytes=p.stat().st_size, sha256=digest(p), **probe(p), **legacy_source(stem))

    paths = sorted(p for p in (ROOT / 'sfx').rglob('*') if p.suffix.lower() in SUFFIXES)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        rows.extend(pool.map(existing, paths))
    for row in imports['entries']:
        r = dict(row)
        src = imports['sources'][r['group']]
        r.update(author=src['author'], license=src['license'],
                 rights_status=src['redistribution'], source_evidence='audio-library/imports.json')
        r.setdefault('source_url', src['url'])
        if r.get('repository_path'):
            p = ROOT / r['repository_path']
            if not p.is_file() or digest(p) != r['sha256']:
                raise ValueError('新增原檔缺失或雜湊不符：' + str(p))
        rows.append(r)
    groups = defaultdict(list)
    for r in rows:
        groups[r['sha256']].append(r['id'])
    duplicates = [ids for ids in groups.values() if len(ids) > 1]
    generated = dict(schema=1, catalog_version='1.0.0', created_at=imports['created_at'],
                     game_version=facts['version'],
                     note='開發用索引。檔名推定用途不等於人工試聽；既有授權缺口未自動補造。',
                     counts=dict(total=len(rows), existing=len(paths), imported=len(imports['entries']),
                                 imported_files=sum(bool(x.get('repository_path')) for x in imports['entries']),
                                 metadata_only=sum(not x.get('repository_path') for x in imports['entries']),
                                 exact_duplicate_groups=len(duplicates)),
                     exact_duplicates=duplicates, sources=imports['sources'], entries=rows,
                     generated_sounds=[r for r in facts['rows'] if r['kind'] != '音效檔'])
    outputs = {'catalog.json': json.dumps(generated, ensure_ascii=False, indent=2) + '\n'}
    buffer = io.StringIO(newline='')
    fields = ['id', 'group', 'category', 'description', 'original_path', 'repository_path',
              'availability', 'use_status', 'author', 'source_url', 'license', 'rights_status',
              'duration_seconds', 'sample_rate_hz', 'bit_depth', 'channels', 'codec', 'bytes', 'sha256']
    writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(rows)
    outputs['catalog.csv'] = '\ufeff' + buffer.getvalue()

    def esc(s):
        return str(s or '—').replace('|', '／').replace('\n', ' ')

    lines = ['# 音效素材目錄', '',
             '資料庫版本 1.0.0；逐檔規格以 ffprobe 讀取，SHA-256 以原檔計算。用途多依檔名及既有程式整理，待主人試聽。', '',
             '手機可用 GitHub 頁面內搜尋檔名；完整欄位見 [JSON](catalog.json)／[CSV](catalog.csv)。', '',
             '「僅索引」項目沒有公開音檔；請從該列的來源頁取得。既有遊戲用檔不代表可當通用素材再次散布。', '']
    for group in ['existing', *imports['sources']]:
        current = [r for r in rows if r['group'] == group]
        lines.extend([f'## {group}（{len(current)} 檔）', ''])
        for cat in sorted({r['category'] for r in current}):
            lines.extend([f'### {cat}', '', '| 檔名／取用位置 | 說明 | 秒數／規格 | 使用狀態 | 作者／授權 |', '|---|---|---|---|---|'])
            for r in current:
                if r['category'] != cat:
                    continue
                label = Path(r['original_path']).name
                # 空白及特殊字元須編碼，避免 Markdown 連結中斷。
                from urllib.parse import quote
                link = '../' + quote(r['repository_path']) if r.get('repository_path') else r.get('source_url')
                filecell = f'[{label}]({link})' if link else label
                spec = f"{r['duration_seconds']:.3f}s／{r['sample_rate_hz']}Hz／{r['channels']}ch"
                lines.append('| ' + ' | '.join([filecell, esc(r['description']), spec, esc(r['use_status'] + '；' + r['availability']), esc(r['author'] + '；' + r['license'])]) + ' |')
            lines.append('')
    lines.extend(['## 即時合成與組合音效', '', '這些名稱沒有獨立原始音檔，定義與呼叫位置見 index.html。', '', '| 名稱 | 類型 | 說明 |', '|---|---|---|'])
    for r in generated['generated_sounds']:
        lines.append(f"| {r['k']} | {r['kind']} | {esc(r['desc'])} |")
    outputs['CATALOG.md'] = '\n'.join(lines) + '\n'
    public = sorted((ROOT / r['repository_path']) for r in rows if r.get('repository_path'))
    outputs['SHA256SUMS.txt'] = ''.join(f'{digest(p)}  {p.relative_to(ROOT).as_posix()}\n' for p in public)
    manifest = dict(schema=1, catalog_version='1.0.0', created_at=imports['created_at'],
                    game_version=facts['version'], index_sha256=digest(ROOT / 'index.html'),
                    counts=generated['counts'],
                    files=[dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size, sha256=digest(p)) for p in public])
    outputs['MANIFEST.json'] = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    return outputs, generated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='只核對輸出，不修改檔案')
    args = parser.parse_args()
    outputs, data = render()
    changed = []
    for name, text in outputs.items():
        path = LIB / name
        raw = text.encode('utf-8')
        if not path.exists() or path.read_bytes() != raw:
            changed.append(name)
            if not args.check:
                path.write_bytes(raw)
    if args.check and changed:
        print('失敗：音效索引過期或遭變更：' + '、'.join(changed))
        return 1
    print(('通過：' if args.check else '已建立：') + json.dumps(data['counts'], ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
