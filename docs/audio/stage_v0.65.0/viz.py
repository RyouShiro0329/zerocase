import librosa, numpy as np, matplotlib
matplotlib.use('Agg');import matplotlib.pyplot as plt, librosa.display, json
SFX='/home/claude/zerocase/sfx/'
out={}
fig,axs=plt.subplots(4,1,figsize=(16,12))
for i,stem in enumerate(['bgm_hitman_battle','bgm_hitman_intense']):
    y,sr=librosa.load(SFX+stem+'.ogg',sr=22050,duration=12)
    tempo,beats=librosa.beat.beat_track(y=y,sr=sr,units='time',tightness=100)
    oenv=librosa.onset.onset_strength(y=y,sr=sr);t=librosa.times_like(oenv,sr=sr)
    ax=axs[i*2];librosa.display.waveshow(y,sr=sr,ax=ax,alpha=.6);ax.vlines(beats,-1,1,color='r',lw=.6);ax.set_title(stem+' waveform 0-12s, red=beats');ax.set_xticks(np.arange(0,12.01,.5))
    ax=axs[i*2+1];S=librosa.amplitude_to_db(np.abs(librosa.stft(y,n_fft=2048,hop_length=256)),ref=np.max);librosa.display.specshow(S,sr=sr,hop_length=256,x_axis='time',y_axis='log',ax=ax);ax.plot(t,oenv/oenv.max()*8000+40,color='w',lw=.7);ax.vlines(beats,40,10000,color='c',lw=.5);ax.set_xticks(np.arange(0,12.01,.5))
    out[stem]=[round(float(b),3) for b in beats]
plt.tight_layout();plt.savefig('hitman_first12s.png',dpi=70)
print(json.dumps(out))
