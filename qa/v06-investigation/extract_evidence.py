"""從已完成的診斷 ZIP 只讀取 JSON／日誌，避免重複下載素材。"""
import hashlib, io, json, os, pathlib, re, urllib.error, urllib.request, zipfile

REPO = 'RyouShiro0329/zerocase'
ARTIFACTS = {
    'historical-paired': 15152785099,
    'current-observed': 15152646133,
    'current-solo': 15152147113,
    'current-paired': 15151708866,
}
OUT = pathlib.Path('test-results/v06-evidence')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def signed_url(artifact):
    url = f'https://api.github.com/repos/{REPO}/actions/artifacts/{artifact}/zip'
    request = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
        'Accept': 'application/vnd.github+json',
    })
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=60):
            raise RuntimeError('ZIP API 沒有提供預期的重新導向')
    except urllib.error.HTTPError as e:
        if e.code != 302:
            raise RuntimeError('GitHub API 狀態 ' + str(e.code)) from None
        return e.headers['Location']

class RangeFile(io.RawIOBase):
    def __init__(self, url):
        self.url, self.pos, self.cache, self.received = url, 0, {}, 0
        _, self.size = self.fetch(0, 0)

    def fetch(self, start, end):
        req = urllib.request.Request(self.url, headers={
            'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity',
        })
        with urllib.request.urlopen(req, timeout=60) as r:
            if r.status != 206:
                raise RuntimeError('儲存服務未提供部分讀取，停止整包下載')
            total = int(r.headers['Content-Range'].split('/')[-1])
            data = r.read(end - start + 2)
            if len(data) != end - start + 1:
                raise RuntimeError('部分讀取長度不符')
            self.received += len(data)
            return data, total

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        if self.pos < 0:
            raise ValueError('負位移')
        return self.pos

    def read(self, n=-1):
        n = self.size - self.pos if n < 0 else min(n, self.size - self.pos)
        if n > 16 * 1024 * 1024:
            raise RuntimeError('非預期的大量讀取')
        result = bytearray()
        while n:
            block = self.pos // 131072 * 131072
            if block not in self.cache:
                if len(self.cache) >= 64:
                    self.cache.clear()
                self.cache[block], _ = self.fetch(block, min(block + 131071, self.size - 1))
            data = self.cache[block]
            at = self.pos - block
            take = min(n, len(data) - at)
            result.extend(data[at:at + take])
            self.pos += take
            n -= take
        return bytes(result)

OUT.mkdir(parents=True, exist_ok=True)
manifest = []
for group, artifact in ARTIFACTS.items():
    remote = RangeFile(signed_url(artifact))
    files = []
    with zipfile.ZipFile(remote) as z:
        for entry in z.infolist():
            name = entry.filename
            if not (name == 'summary.json' or re.fullmatch(r'\d{2}/v(?:06|10)/out/[^/]+\.json', name) or re.fullmatch(r'\d{2}/v(?:06|10)/out\.(?:log|exit)', name)):
                continue
            dest = OUT / group / name
            if not dest.resolve().is_relative_to(OUT.resolve()):
                raise RuntimeError('路徑不合法')
            data = z.read(entry)  # zipfile 同時核對該項目的 CRC。
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            files.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    manifest.append({'group': group, 'artifact': artifact, 'archiveBytes': remote.size, 'receivedBytes': remote.received, 'files': files})
    print(json.dumps({'group': group, 'files': len(files), 'receivedBytes': remote.received}))
(OUT / 'selection-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
