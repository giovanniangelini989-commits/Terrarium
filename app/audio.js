(function(){
'use strict';
const AU={ctx:null,master:null,beatG:null,padG:null,vol:.6,suoni:true,voce:true,E:20,night:false,timer:null,nextBeat:0,voice:null,ready:false};
function C(){ return AU.ctx; }
AU.configure=o=>{ if('vol' in o) AU.vol=o.vol; if('suoni' in o) AU.suoni=o.suoni; if('voce' in o) AU.voce=o.voce; if(AU.master) AU.master.gain.setTargetAtTime(AU.suoni?AU.vol:0,C().currentTime,.05); if(!AU.voce) AU.stopVoice(); };
AU.unlockVoice=()=>{ if(AU.vu) return; AU.vu=1; try{ const Sy=window.speechSynthesis; if(Sy&&!window.__fast){ const u=new SpeechSynthesisUtterance(' '); u.volume=0; Sy.speak(u); } }catch(e){} };
AU.unlock=()=>{ try{ if(AU.ctx){ if(AU.ctx.state==='suspended') AU.ctx.resume(); return; } const X=window.AudioContext||window.webkitAudioContext; if(!X) return; AU.ctx=new X(); AU.master=AU.ctx.createGain(); AU.master.gain.value=AU.suoni?AU.vol:0; AU.master.connect(AU.ctx.destination);
  AU.beatG=AU.ctx.createGain(); AU.beatG.gain.value=.55; AU.beatG.connect(AU.master); AU.padG=AU.ctx.createGain(); AU.padG.gain.value=.0; AU.padG.connect(AU.master); pad(); AU.nextBeat=AU.ctx.currentTime+.3; AU.timer=setInterval(tick,110); AU.ready=true; }catch(e){} };
function pad(){ const c=C(); [[110,'sine',.5],[164.81,'sine',.35],[220.5,'triangle',.18]].forEach(([f,t,g],i)=>{ const o=c.createOscillator(), l=c.createOscillator(), lg=c.createGain(), og=c.createGain(); o.type=t; o.frequency.value=f*(1+i*.002); l.frequency.value=.07+.03*i; lg.gain.value=g*.4; og.gain.value=g; l.connect(lg); lg.connect(og.gain); o.connect(og); og.connect(AU.padG); o.start(); l.start(); }); AU.padG.gain.setTargetAtTime(.07,c.currentTime,3); }
function thump(t,g){ const c=C(), o=c.createOscillator(), a=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(78,t); o.frequency.exponentialRampToValueAtTime(40,t+.14); a.gain.setValueAtTime(0,t); a.gain.linearRampToValueAtTime(g,t+.012); a.gain.exponentialRampToValueAtTime(.001,t+.28); o.connect(a); a.connect(AU.beatG); o.start(t); o.stop(t+.32); }
function tick(){ const c=C(); if(!c||document.hidden||!AU.suoni) return; const bpm=56+AU.E*.32; while(AU.nextBeat<c.currentTime+.3){ thump(AU.nextBeat,.9); thump(AU.nextBeat+.22,.55); AU.nextBeat+=60/bpm; } }
function note(f,t,d,g,type){ const c=C(), o=c.createOscillator(), a=c.createGain(); o.type=type||'sine'; o.frequency.value=f; a.gain.setValueAtTime(0,t); a.gain.linearRampToValueAtTime(g,t+.015); a.gain.exponentialRampToValueAtTime(.0008,t+d); o.connect(a); a.connect(AU.master); o.start(t); o.stop(t+d+.05); }
function swell(fs,t,d,g){ const c=C(); fs.forEach((f,i)=>{ const o=c.createOscillator(), a=c.createGain(); o.type=i?'triangle':'sine'; o.frequency.value=f; a.gain.setValueAtTime(0,t); a.gain.linearRampToValueAtTime(g,t+d*.45); a.gain.linearRampToValueAtTime(0,t+d); o.connect(a); a.connect(AU.master); o.start(t); o.stop(t+d+.05); }); }
AU.sfx=name=>{ const c=C(); if(!c||!AU.suoni) return; const t=c.currentTime+.02;
  switch(name){
   case 'mut': note(880,t,1.6,.16); note(1318,t+.12,1.2,.08); break;
   case 'arrivo': note(660,t,.5,.12); note(880,t+.18,.7,.1); break;
   case 'societa': swell([330,392,494],t,3.4,.07); break;
   case 'finale': swell([220,277,330,440],t,5.5,.07); break;
   case 'spento': [523,440,370,294].forEach((f,i)=>note(f,t+i*.7,1.6,.12)); break;
   case 'level': [660,784,988,1175,1568].forEach((f,i)=>note(f,t+i*.13,1.2,.1)); break;
   case 'biscotto': thump(t,1); note(1760,t+.15,.6,.05); note(2093,t+.25,.5,.04); break;
   case 'guerra': [98,98,110].forEach((f,i)=>note(f,t+i*.4,.9,.14,'triangle')); break;
   case 'pace': note(523,t,1.4,.1); note(659,t+.25,1.4,.08); note(784,t+.5,1.6,.08); break;
   case 'tonfo': thump(t,1); thump(t+.22,.6); break;
   case 'azione': note(1200,t,.14,.06); break;
   case 'pagina': note(988,t,.9,.07); note(1480,t+.1,.9,.05); break;
  } };
AU.setState=(E,night)=>{ AU.E=E; AU.night=night; };
AU.say=(txt,rate)=>{ if(!AU.voce||!AU.suoni) return; try{ const S=window.speechSynthesis; if(!S||window.__fast) return; S.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang='it-IT'; u.rate=rate||.92; u.pitch=.98; u.volume=Math.min(1,AU.vol+.2); const vs=S.getVoices(); const v=AU.voice||vs.find(x=>/it[-_]IT/i.test(x.lang)&&/alice|federica|luca|elsa|google/i.test(x.name))||vs.find(x=>/^it/i.test(x.lang)); if(v){ AU.voice=v; u.voice=v; } S.speak(u); }catch(e){} };
AU.stopVoice=()=>{ try{ window.speechSynthesis&&window.speechSynthesis.cancel(); }catch(e){} };
['pointerdown','touchend','click'].forEach(ev=>document.addEventListener(ev,()=>{ AU.unlock(); AU.unlockVoice(); },{passive:true}));
document.addEventListener('visibilitychange',()=>{ const c=C(); if(!c) return; if(document.hidden) c.suspend&&c.suspend(); else c.resume&&c.resume(); });
window.__au=AU;
})();
