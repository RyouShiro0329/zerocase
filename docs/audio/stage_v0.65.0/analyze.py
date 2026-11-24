import librosa, numpy as np, json, subprocess, sys
SFX='/home/claude/zerocase/sfx/'
res={}
def load(fn):
    y,sr=librosa.load(SFX+fn,sr=22050,mono=True);return y,sr
for stem in ['bgm_hitman_battle','bgm_hitman_intense']:
    R={}
    yo,sr=load(stem+'.ogg'); ym,_=load(stem+'.mp3')
    # OGG／MP3 前置空白：互相關取第一段 10 秒
    n=sr*10;a=yo[:n];b=ym[:n]
    c=np.correlate(b[:n],a[:n//2],'valid');lag=int(np.argmax(c))
    R['mp3_vs_ogg_offset_ms']=round(lag/sr*1000,1)
    # 起音：第一個超過 -40 dBFS 的位置
    for k,y in [('ogg',yo),('mp3',ym)]:
        idx=np.argmax(np.abs(y)>10**(-40/20));R[k+'_first_sound_ms']=round(idx/sr*1000,1);R[k+'_dur_s']=round(len(y)/sr,3)
    y=yo
    tempo,beats=librosa.beat.beat_track(y=y,sr=sr,units='time',tightness=100)
    R['tempo_bpm']=float(np.round(np.atleast_1d(tempo)[0],2));R['beats_first16_s']=[round(float(x),3) for x in beats[:16]]
    bi=np.diff(beats);R['beat_interval_median_s']=round(float(np.median(bi)),4)
    oenv=librosa.onset.onset_strength(y=y,sr=sr);times=librosa.times_like(oenv,sr=sr)
    on=librosa.onset.onset_detect(onset_envelope=oenv,sr=sr,units='time')
    R['onsets_first_8s']=[round(float(x),3) for x in on if x<8]
    # 每拍的強度（onset strength 取拍點附近最大），找最前面幾拍的強拍
    st=[float(oenv[max(0,np.searchsorted(times,b)-2):np.searchsorted(times,b)+3].max()) for b in beats[:32]]
    R['beat_strength_first32']=[round(x,2) for x in st]
    # 能量（RMS）每 0.25 秒，前 12 秒與最後 3 秒
    rms=librosa.feature.rms(y=y,frame_length=2048,hop_length=512)[0];rt=librosa.times_like(rms,sr=sr,hop_length=512)
    def db(t0,t1):m=(rt>=t0)&(rt<t1);return round(float(20*np.log10(rms[m].mean()+1e-9)),1)
    R['rms_db_quarter_s_first12']=[db(i/4,(i+1)/4) for i in range(48)]
    R['rms_db_last3']=[db(len(y)/sr-3+i/4,len(y)/sr-3+(i+1)/4) for i in range(12)]
    # 段落變化：用 chroma+mfcc 的 novelty（前 20 秒）
    mf=librosa.feature.mfcc(y=y[:sr*20],sr=sr,hop_length=512);S=librosa.segment.recurrence_matrix(mf,mode='affinity',sym=True)
    bounds=librosa.segment.agglomerative(mf,6);R['segment_bounds_first20_s']=[round(float(x),2) for x in librosa.frames_to_time(bounds,sr=sr,hop_length=512)]
    res[stem]=R
json.dump(res,open('/home/claude/qa/audio/analysis.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(res,ensure_ascii=False,indent=1))
