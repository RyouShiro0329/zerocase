"""使用每次實際播放的時鐘，將原音檔對齊錄影；不變速、不變調。"""
from pathlib import Path
import json,subprocess
r=Path('qa-output/bow-preview').resolve();d=json.loads((r/'frames.json').read_text());frames=d['frames'];lines=[]
for i,f in enumerate(frames):
    lines.extend(["file '"+str(r/f['file'])+"'",'option framerate 1000',f"duration {(frames[i+1]['at']-f['at'])/1000 if i+1<len(frames) else .04:.6f}"])
(r/'frames.ffconcat').write_text('\n'.join(lines)+'\n');filters=[];names=[];starts=[max(0,(shot['at']-frames[0]['at'])/1000) for shot in d['shots']]
for i,t in enumerate(starts):
    bow=d['shots'][i]['mode']=='bow'
    for j,gain in [(0,.86*.92*.85),(1,.86*.92*.8)]:
        name=f'a{i}{j}';delay=round((t+(.91 if j and bow else 0))*1000);source=(1 if bow else 3) if j==0 else 2;filters.append(f'[{source}:a]volume={gain},adelay={delay}:all=1[{name}]');names.append(f'[{name}]')
for i,t in enumerate(starts):
    if d['shots'][i]['mode']=='bow':
        name=f'layer{i}';filters.append(f'[3:a]volume={.86*.92*.85},adelay={round((t+1.01)*1000)}:all=1[{name}]');names.append(f'[{name}]')
duration=(frames[-1]['at']-frames[0]['at'])/1000+.04
filters.append(''.join(names)+f'amix=inputs={len(names)}:normalize=0,asetpts=N/SR/TB,apad=pad_dur=0.5[a]')
filters.append('[0:v]fps=30[v]')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(r/'frames.ffconcat'),'-i','sfx/bowdraw.mp3','-i','sfx/bowimpact.mp3','-i','preview/bow/crossbow-dry.wav','-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-t',str(duration),str(r/'bow-crossbow-preview.mp4')],check=True)
(r/'video-timing.json').write_text(json.dumps({'shotStarts':starts,'impactSourceOffset':{'bow':.91,'crossbow':0},'bowReleaseLayerOffset':1.01,'audio':'原遊戲音檔依實際播放時鐘對時合成'},ensure_ascii=False,indent=2))
