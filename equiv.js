const Old=require('./engine_old.js'), New=require('./sim.js');
const R=Old.rng(2026); let diff=0,tot=0,first=null;
for(let i=0;i<600;i++){ const su=Old.randomSetup(R); const days=60+Math.floor(R()*120); const seed=7000+i;
  const a=Old.run(JSON.parse(JSON.stringify(su)),{days,seed}), b=New.run(JSON.parse(JSON.stringify(su)),{days,seed});
  const pick=r=>JSON.stringify({log:r.log,R:r.series.R,E:r.series.E,pop:r.series.pop,h:r.headline,t:r.tipo,f:r.finale,sub:r.sub,soc:r.societies,w:r.warCount,m:r.monsters,e:r.extinct,al:r.alive,Rm:r.Rm,sp:r.sp});
  tot++; if(pick(a)!==pick(b)){ diff++; if(!first) first={i,su,days,seed}; } }
console.log('confrontati',tot,'vasi · differenze:',diff); if(first) console.log(JSON.stringify(first));
