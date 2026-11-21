from pathlib import Path
import json,subprocess
r=Path('qa-output/bow-preview').resolve();d=json.loads((r/'frames.json').read_text());frames=d['frames'];lines=[]
for i,f in enumerate(frames):
    lines.extend(["file '"+str(r/f['file'])+"'",'option framerate 1000',f"duration {(frames[i+1]['at']-f['at'])/1000 if i+1<len(frames) else .04:.6f}"])
(r/'frames.ffconcat').write_text('\n'.join(lines)+'\n');delay=round(d['audioStartAt']-frames[0]['at']);af=f'adelay={delay}:all=1' if delay>=0 else f'atrim=start={-delay/1000},asetpts=PTS-STARTPTS'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(r/'frames.ffconcat'),'-i',str(r/'audio.webm'),'-filter_complex',f'[0:v]fps=30[v];[1:a]{af}[a]','-map','[v]','-map','[a]','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(r/'bow-crossbow-preview.mp4')],check=True)
