from pathlib import Path
import subprocess,json,re,hashlib
import numpy as np
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--workspace',required=True,help='含 upload 及 radio_voice_work/segments.json 的資料夾');parser.add_argument('--repo',required=True);args=parser.parse_args()
root=Path(args.workspace);repo=Path(args.repo);dest=repo/'sfx';upload=root/'upload';work=root/'audio-next-build';work.mkdir(exist_ok=True)
records=[]
def ff(args):return subprocess.run(['ffmpeg','-y','-v','error']+args,check=True)
def encode(name,src,flt='anull',start=0,duration=None):
 args=['-ss',str(start),'-i',str(src)]
 if duration is not None:args+=['-t',str(duration)]
 tmp=work/(name+'.wav');ff(args+['-af',flt,'-ar','44100','-ac','2','-c:a','pcm_f32le',str(tmp)])
 stats=subprocess.run(['ffmpeg','-hide_banner','-i',str(tmp),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
 mean=float(re.search(r'mean_volume: ([\-\d.]+)',stats)[1]);peak=float(re.search(r'max_volume: ([\-\d.]+)',stats)[1]);gain=min(-20-mean,-3-peak)
 if name=='pumpstop':gain=min(gain,15.2)
 out=dest/(name+'.mp3');ff(['-i',str(tmp),'-af',f'volume={gain}dB','-c:a','libmp3lame','-q:a','3',str(out)])
 records.append(dict(id=name,source=src.name,start=start,duration=duration,filter=flt,gain_db=round(gain,2),sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
 return tmp
encode('glassstep',upload/'757830__lukacafuka__stepping-on-broken-glass.wav','afade=t=in:d=0.01,afade=t=out:st=2.3:d=0.2',1,2.5)
encode('radiostatic',upload/'812929__harrisonlace__comradio_static-am-transmission.wav','afade=t=in:d=0.02,afade=t=out:st=1.3:d=0.2',0,1.5)
# 相位持續的短交疊循環，去除原錄音停機尾段。
for name,src,start in [('waterpipe','797674__henkonen__water-mechanism-hum-loop.wav',10),('waterpump','221551__unfa__industrial-water-machine-noise-with-switch-off.flac',10)]:
 raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',str(upload/src),'-t','12','-ar','44100','-ac','2','-f','f32le','-']);a=np.frombuffer(raw,dtype=np.float32).reshape(-1,2);n=22050
 ramp=np.linspace(0,1,n)[:,None];loop=np.concatenate([a[n:-n],a[-n:]*(1-ramp)+a[:n]*ramp]).astype(np.float32)
 wav=work/(name+'-loop.wav');subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','44100','-ac','2','-i','-','-c:a','pcm_f32le',str(wav)],input=loop.tobytes(),check=True)
 encode(name,wav)
ff(['-i',str(dest/'waterpump.mp3'),'-i',str(dest/'waterpipe.mp3'),'-filter_complex','[0:a]volume=0.75[a];[1:a]volume=0.35[b];[a][b]amix=inputs=2:normalize=0','-c:a','pcm_f32le',str(work/'pumpmix-source.wav')])
encode('pumpmix',work/'pumpmix-source.wav')
encode('pumpstop',upload/'221551__unfa__industrial-water-machine-noise-with-switch-off.flac','afade=t=in:d=0.05,afade=t=out:st=5.0:d=0.5',83,5.5)
src=upload/'voicebosch-radio-soldier-announcer-pack-197724.mp3'
for s in json.loads((root/'radio_voice_work/segments.json').read_text()):
 encode('radio'+str(s['index']).zfill(2),src,'rubberband=tempo=1:pitch=0.9438743127:formant=preserved',s['start'],s['end']-s['start'])
for r in records:ff(['-i',str(dest/(r['id']+'.mp3')),'-f','null','-'])
(repo/'docs/audio/PROCESSING_V0.21.10.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('音效轉製並解碼完成：',len(records))
