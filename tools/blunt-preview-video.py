"""將實際瀏覽器逐格截圖與原遊戲錄音對時，產生預覽影片。"""
import json, subprocess
from pathlib import Path

root = Path('qa-output/blunt-redesign').resolve()
capture = json.loads((root / 'frames.json').read_text())
frames = capture['frames']
lines = []
for i, frame in enumerate(frames):
    lines.append("file '" + str(root / frame['file']) + "'")
    lines.append('option framerate 1000')
    duration = (frames[i+1]['at']-frame['at'])/1000 if i+1<len(frames) else .04
    lines.append(f'duration {duration:.6f}')
(root / 'frames.ffconcat').write_text('\n'.join(lines)+'\n')
delay = (capture['audioStartAt']-frames[0]['at'])/1000
audio_filter = f'adelay={round(delay*1000)}:all=1' if delay>=0 else f'atrim=start={-delay:.6f},asetpts=PTS-STARTPTS'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(root/'frames.ffconcat'),'-i',str(root/'audio.webm'),'-filter_complex',f'[0:v]trim=start=1,setpts=PTS-STARTPTS,fps=30[v];[1:a]{audio_filter},atrim=start=1,asetpts=PTS-STARTPTS[a]','-map','[v]','-map','[a]','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(root/'blunt-redesign-gameplay.mp4')],check=True)
