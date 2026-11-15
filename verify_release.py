"""驗證完整更新包。使用方式：python3 verify_release.py"""
import hashlib,json,pathlib,sys
root=pathlib.Path(__file__).resolve().parent
manifest=json.loads((root/'MANIFEST.json').read_text(encoding='utf-8'))
errors=[]
for name,expected in manifest['files'].items():
    f=root/name
    if not f.is_file():errors.append('缺少檔案：'+name)
    elif hashlib.sha256(f.read_bytes()).hexdigest()!=expected:errors.append('雜湊不符：'+name)
for e in errors:print(e)
print('驗證通過' if not errors else '驗證失敗',len(manifest['files']),'個檔案，版本',manifest['version'])
sys.exit(bool(errors))
