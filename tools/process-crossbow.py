"""Erdie bow02 衍生弩發射聲：保留前緣、減弱嗡鳴與長尾，不變速變調。"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt,lfilter
src,dest=map(Path,sys.argv[1:3]);sr,raw=wavfile.read(src);x=raw.astype(np.float64)/32768
assert sr==44100 and x.ndim==1
x=sosfilt(butter(2,120,fs=sr,btype='highpass',output='sos'),x)
x=sosfilt(butter(2,7800,fs=sr,btype='lowpass',output='sos'),x)
for freq,db,q in [(900,-3,2),(1900,-2,3)]:
    A=10**(db/40);w=2*np.pi*freq/sr;alpha=np.sin(w)/(2*q);c=np.cos(w)
    b=np.array([1+alpha*A,-2*c,1-alpha*A]);a=np.array([1+alpha/A,-2*c,1-alpha/A]);x=lfilter(b/a[0],a/a[0],x)
t=np.arange(len(x))/sr;x*=np.exp(-np.maximum(0,t-.13)/.045)
x=x[:round(sr*.33)];x[:round(sr*.002)]*=np.linspace(0,1,round(sr*.002));x[-round(sr*.05):]*=np.linspace(1,0,round(sr*.05));x*=min(1,.89/np.max(np.abs(x)))
wavfile.write(dest,sr,np.round(np.clip(x,-1,1)*32767).astype(np.int16))
print(json.dumps({'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'derivedSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'duration':len(x)/sr,'peakDbFS':20*np.log10(np.max(np.abs(x))),'speed':1,'pitchShift':0},ensure_ascii=False))
