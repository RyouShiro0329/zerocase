#!/usr/bin/env python3
"""以重新上傳的來源獨立驗收音效庫；不匯入既有建置工具。需要 libarchive-c、ffmpeg、ffprobe。"""
import argparse
import concurrent.futures
import csv
import hashlib
import io
import json
import re
import subprocess
import tempfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
AUDIO = {'.wav', '.ogg', '.mp3', '.flac', '.aif', '.aiff', '.m4a'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def inspect_audio(path):
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)], capture_output=True, text=True)
    result = {'probe_exit': p.returncode, 'probe_error': p.stderr}
    if p.returncode == 0:
        d = json.loads(p.stdout)
        streams = [s for s in d['streams'] if s['codec_type'] == 'audio']
        result['stream_count'] = len(streams)
        if streams:
            s = streams[0]
            result.update(codec=s['codec_name'], sample_rate_hz=int(s['sample_rate']), channels=s['channels'],
                          bit_depth=int(s.get('bits_per_raw_sample') or s.get('bits_per_sample') or 0) or None,
                          duration_seconds=round(float(d['format']['duration']), 6))
    p = subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-xerror', '-err_detect', 'explode', '-i', str(path), '-map', '0:a', '-f', 'null', '-'], capture_output=True, text=True)
    result.update(decode_exit=p.returncode, decode_error=p.stderr)
    return result


def main():
    import libarchive
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--base', default='e414cb83efab9dc2f593428d294dc34aa0f69755')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    imports = json.loads((ROOT / 'audio-library/imports.json').read_text())
    catalog = json.loads((ROOT / 'audio-library/catalog.json').read_text())
    manifest = json.loads((ROOT / 'audio-library/MANIFEST.json').read_text())
    errors = {k: [] for k in ['source_not_indexed', 'index_source_missing', 'size_or_hash_mismatch',
              'public_missing_or_extra', 'duplicate_id_or_path_collision', 'decode_failure', 'unable_to_verify',
              'metadata_mismatch', 'baseline_changed', 'links_or_derived_mismatch', 'variant_mismatch']}
    inventory, sources, jobs = [], [], []
    archive_by_hash = {r['sha256']: r for r in imports['archives']}
    with tempfile.TemporaryDirectory(prefix='zerocase-audio-audit-') as tmp:
        for source in sorted(args.sources.iterdir()):
            if not source.is_file():
                continue
            raw = source.read_bytes()
            record = dict(name=source.name, bytes=len(raw), sha256=sha(raw), readable=True)
            sources.append(record)
            is_archive = source.suffix.lower() in {'.zip', '.rar'}
            known = archive_by_hash.get(record['sha256']) if is_archive else None
            record['expected_archive'] = known
            if is_archive and known is None:
                errors['unable_to_verify'].append({'source': source.name, 'reason': '來源包雜湊未對應匯入紀錄'})
            try:
                def member(name, data, directory=False):
                    ext = Path(name).suffix.lower()
                    kind = 'directory' if directory else 'audio' if ext in AUDIO else 'license' if re.search('licen[sc]e|copyright|eula', name, re.I) else 'documentation' if re.search('readme|read.me|instruction|file.list', name, re.I) else 'other'
                    r = dict(source=source.name, original_archive=known['name'] if known else source.name if is_archive else None,
                             original_path=name, kind=kind, bytes=len(data), sha256=sha(data) if not directory else None,
                             group=known['group'] if known else 'freesound-silverillusionist' if 'silverillusionist' in name.lower() else 'freesound-ihitokage',
                             git_blob_sha=hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() if not directory else None)
                    inventory.append(r)
                    if kind == 'other':
                        errors['unable_to_verify'].append({'source': source.name, 'path': name, 'reason': '未知非音檔項目，需人工確認'})
                    if kind == 'license' and known and known['group'] == 'darkworld-survival':
                        license_path = ROOT / 'audio-library/licenses/darkworld-survival.pdf'
                        if not license_path.is_file() or license_path.read_bytes() != data:
                            errors['size_or_hash_mismatch'].append({'source': source.name, 'path': name, 'reason': '隨包授權 PDF 與公開副本不同'})
                    if kind == 'audio':
                        dest = Path(tmp) / (str(len(inventory)) + ext)
                        dest.write_bytes(data)
                        jobs.append((r, dest))
                    if not directory and not data:
                        errors['unable_to_verify'].append({'source': source.name, 'path': name, 'reason': '空檔'})
                if is_archive:
                    with libarchive.file_reader(str(source)) as archive:
                        for entry in archive:
                            if entry.issym or entry.islnk:
                                errors['unable_to_verify'].append({'source': source.name, 'path': entry.pathname, 'reason': '符號或硬連結'})
                            member(entry.pathname, b''.join(entry.get_blocks()), entry.isdir)
                    record['archive_readable'] = True
                else:
                    member(source.name, raw)
            except Exception as exc:
                record['archive_readable'] = False
                errors['unable_to_verify'].append({'source': source.name, 'reason': str(exc)})
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            for (row, _), result in zip(jobs, pool.map(lambda pair: inspect_audio(pair[1]), jobs)):
                row['audio'] = result
                if result['probe_exit'] or result['decode_exit'] or result.get('stream_count') != 1:
                    errors['decode_failure'].append(row.copy())
        write(args.out / 'source-inventory.json', {'time': datetime.now(ZoneInfo('Asia/Taipei')).isoformat(), 'sources': sources, 'members': inventory})

    audio = [x for x in inventory if x['kind'] == 'audio']
    by_key = defaultdict(list)
    for r in audio:
        by_key[(r['group'], r['original_archive'], r['original_path'])].append(r)
    matched = set()
    comparisons = []
    for r in imports['entries']:
        key = (r['group'], r['original_archive'], r['original_path'])
        found = by_key.get(key, [])
        # 單檔重新上傳可能加上 (1)；只在內容大小與雜湊相符時接受替代檔名。
        if not found and not r['original_archive']:
            found = [x for x in audio if not x['original_archive'] and x['sha256'] == r['sha256'] and x['bytes'] == r['bytes']]
        if len(found) != 1:
            errors['index_source_missing'].append({'id': r['id'], 'matches': len(found)})
            continue
        s = found[0]
        matched.add((s['source'], s['original_path']))
        comp = dict(id=r['id'], source=s['source'], original_path=s['original_path'], source_bytes=s['bytes'],
                    source_sha256=s['sha256'], source_git_blob_sha=s['git_blob_sha'], repository_path=r.get('repository_path'), audio=s['audio'])
        comparisons.append(comp)
        for f in ['bytes', 'sha256']:
            if s[f] != r[f]:
                errors['size_or_hash_mismatch'].append({'id': r['id'], 'field': f, 'source': s[f], 'index': r[f]})
        for f in ['codec', 'sample_rate_hz', 'channels', 'bit_depth', 'duration_seconds']:
            v = s['audio'].get(f)
            if v != r.get(f):
                errors['metadata_mismatch'].append({'id': r['id'], 'field': f, 'source': v, 'index': r.get(f)})
        if r.get('repository_path'):
            p = ROOT / r['repository_path']
            if not p.is_file():
                errors['public_missing_or_extra'].append({'id': r['id'], 'reason': '公開檔案不存在'})
            elif p.stat().st_size != s['bytes'] or sha(p.read_bytes()) != s['sha256']:
                errors['size_or_hash_mismatch'].append({'id': r['id'], 'reason': '公開原檔與來源不同'})
    for r in audio:
        if (r['source'], r['original_path']) not in matched:
            errors['source_not_indexed'].append({k: r[k] for k in ['source', 'original_path', 'bytes', 'sha256']})
    for name, rows, fields in [('sources', audio, ['original_path']), ('imports', imports['entries'], ['id', 'repository_path']), ('catalog', catalog['entries'], ['id', 'repository_path'])]:
        for f in fields:
            counts = Counter((r.get('source'), r[f]) if name == 'sources' else r[f] for r in rows if r.get(f))
            errors['duplicate_id_or_path_collision'].extend({'table': name, 'field': f, 'key': k, 'count': n} for k, n in counts.items() if n > 1)
    # 全倉庫追蹤檔案重新算 SHA，避免受限原檔換名出現在別處。
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    tracked = [p for p in tracked if p]
    restricted = {r['sha256']: r['id'] for r in imports['entries'] if not r.get('repository_path')}
    restricted.update({r['sha256']: r['name'] for r in sources if Path(r['name']).suffix.lower() in {'.rar', '.zip'}})
    for p in tracked:
        data = (ROOT / p).read_bytes()
        if sha(data) in restricted:
            errors['public_missing_or_extra'].append({'path': p, 'reason': '受限原檔或原始壓縮包出現在倉庫', 'source': restricted[sha(data)]})
    actual = {p.relative_to(ROOT).as_posix() for folder in ['sfx', 'audio-library/files'] for p in (ROOT / folder).rglob('*') if p.is_file() and p.suffix.lower() in AUDIO}
    indexed = {r['repository_path'] for r in catalog['entries'] if r.get('repository_path')}
    for p in sorted(actual ^ indexed):
        errors['public_missing_or_extra'].append({'path': p, 'reason': '實體檔案與索引集合不同'})
    base_tree = subprocess.check_output(['git', 'ls-tree', '-r', args.base, 'sfx'], cwd=ROOT, text=True).splitlines()
    baseline = []
    for line in base_tree:
        info, p = line.split('\t', 1)
        blob = info.split()[2]
        current = subprocess.run(['git', 'hash-object', '--', p], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        rows = [r for r in catalog['entries'] if r.get('repository_path') == p]
        baseline.append(dict(path=p, baseline_blob_sha=blob, current_blob_sha=current, index_ids=[r['id'] for r in rows]))
        if blob != current or len(rows) != 1:
            errors['baseline_changed'].append(baseline[-1])
    # 使用檔名末端數字作獨立分組，再對照既有 variant_group；不以既有配對鍵自行證明。
    pairs = defaultdict(list)
    for r in audio:
        if r['group'] != 'zombie-massacre':
            continue
        stem = re.sub(r'_24_bit$', '', Path(r['original_path']).stem)
        stem = re.sub(r'\d+', lambda m: str(int(m[0])), stem)
        pairs[stem].append(r)
    pair_results = []
    for key, rows in pairs.items():
        ids = [r['id'] for r in imports['entries'] if r['group'] == 'zombie-massacre' and any(r['original_path'] == s['original_path'] for s in rows)]
        variants = {r['variant_group'] for r in imports['entries'] if r['id'] in ids}
        good = len(rows) == 2 and sorted(r['audio']['bit_depth'] for r in rows) == [16, 24] and len(variants) == 1 and abs(rows[0]['audio']['duration_seconds'] - rows[1]['audio']['duration_seconds']) < .002
        pair_results.append(dict(key=key, original_paths=[r['original_path'] for r in rows], ids=ids, variant_groups=sorted(variants), passed=good))
        if not good:
            errors['variant_mismatch'].append(pair_results[-1])
    if len(pairs) != 99:
        errors['variant_mismatch'].append({'pairs': len(pairs), 'expected': 99})
    # 所有 JSON／CSV／清單逐欄核對，Markdown 所有相對檔案連結核對。
    catalog_ids = {r['id']: r for r in catalog['entries']}
    expected_ids = {r['id'] for r in imports['entries']} | {'existing:' + r['path'] for r in baseline}
    if set(catalog_ids) != expected_ids:
        errors['links_or_derived_mismatch'].append({'reason': 'catalog ID 集合與本批來源及基準既有素材不同', 'extra': sorted(set(catalog_ids) - expected_ids), 'missing': sorted(expected_ids - set(catalog_ids))})
    for r in imports['entries']:
        if any(catalog_ids.get(r['id'], {}).get(k) != v for k, v in r.items()):
            errors['links_or_derived_mismatch'].append({'id': r['id'], 'reason': 'imports 與 catalog 欄位不同'})
    csv_bytes = (ROOT / 'audio-library/catalog.csv').read_bytes()
    csv_rows = list(csv.DictReader(io.StringIO(csv_bytes.decode('utf-8-sig'))))
    if not csv_bytes.startswith(b'\xef\xbb\xbf') or len(csv_rows) != len(catalog['entries']):
        errors['links_or_derived_mismatch'].append({'reason': 'CSV BOM 或筆數不同'})
    for r in csv_rows:
        original = catalog_ids.get(r['id'])
        if original is None or any(v != ('' if original.get(k) is None else str(original[k])) for k, v in r.items()):
            errors['links_or_derived_mismatch'].append({'id': r['id'], 'reason': 'CSV 欄位不同'})
    sums = dict(line.split('  ', 1)[::-1] for line in (ROOT / 'audio-library/SHA256SUMS.txt').read_text().splitlines())
    mf = {r['path']: r for r in manifest['files']}
    if set(mf) != actual or set(sums) != actual:
        errors['links_or_derived_mismatch'].append({'reason': 'MANIFEST 或 SHA256SUMS 集合不同'})
    for p in sorted(actual):
        data = (ROOT / p).read_bytes()
        r = next((r for r in catalog['entries'] if r.get('repository_path') == p), {})
        if sha(data) != sums.get(p) or sha(data) != mf.get(p, {}).get('sha256') or len(data) != mf.get(p, {}).get('bytes') or sha(data) != r.get('sha256'):
            errors['links_or_derived_mismatch'].append({'path': p, 'reason': '公開清單大小或雜湊不同'})
    links = []
    for rel in ['audio-library/README.md', 'audio-library/CATALOG.md', 'docs/audio/LICENSES_AND_ORIGINS.md', 'docs/audio/LIBRARY_HANDOFF.md']:
        p = ROOT / rel
        for target in re.findall(r'\]\(([^)]+)\)', p.read_text()):
            url = urlsplit(target)
            if url.scheme or not url.path:
                continue
            good = (p.parent / unquote(url.path)).exists()
            links.append(dict(document=rel, target=target, exists=good))
            if not good:
                errors['links_or_derived_mismatch'].append(links[-1])
    report = dict(time=datetime.now(ZoneInfo('Asia/Taipei')).isoformat(), commit=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                  baseline=args.base, source_count=len(sources), source_audio_count=len(audio),
                  source_audio_groups=dict(Counter(r['group'] for r in audio)), member_kinds=dict(Counter(r['kind'] for r in inventory)),
                  catalog_counts=catalog['counts'], public_audio_count=len(actual), baseline_sfx_count=len(baseline), zombie_pairs=len(pairs),
                  errors=errors, error_counts={k: len(v) for k, v in errors.items()},
                  limitations=['未逐檔人工試聽；可解碼不代表聽感合格。', '分類主要依檔名推定。', '既有授權缺口與已知上游來源未全數重新查證。', 'Android 待主人實機驗收。'])
    write(args.out / 'comparisons.json', comparisons)
    write(args.out / 'baseline-sfx.json', baseline)
    write(args.out / 'zombie-pairs.json', pair_results)
    write(args.out / 'relative-links.json', links)
    write(args.out / 'result.json', report)
    print(json.dumps({k: report[k] for k in ['source_count', 'source_audio_count', 'source_audio_groups', 'member_kinds', 'error_counts']}, ensure_ascii=False))
    return int(any(errors.values()))


if __name__ == '__main__':
    raise SystemExit(main())
