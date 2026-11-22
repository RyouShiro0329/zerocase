"""將主人提供的 Hitman.mp3 製作成一般／激戰兩段。用法：python3 tools/process-hitman.py INPUT.mp3"""
import pathlib, subprocess, sys
source=pathlib.Path(sys.argv[1]).resolve()
root=pathlib.Path(__file__).resolve().parent.parent
for stem,start,duration in [('battle',0,114),('intense',114,80)]:
    for ext,codec in [('mp3',['-c:a','libmp3lame','-b:a','192k']),('ogg',['-c:a','libvorbis','-q:a','5'])]:
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',str(source),'-t',str(duration),'-af',f'afade=t=in:d=0.02,afade=t=out:st={duration-.02}:d=0.02','-metadata','artist=Kevin MacLeod','-metadata',f'title=Hitman - Zero Case {stem.title()}','-metadata',f'comment=CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ https://incompetech.com ; split {start}-{start+duration}s, 20ms edge fades',*codec,str(root/'sfx'/f'bgm_hitman_{stem}.{ext}')],check=True)
