// Giocatore virtuale: ogni giorno reale = 4 giorni del vaso; sceglie sempre «proteggi» e «mostrati» (o «nascosto» a caso); dopo il finale chiude il capitolo.
const S=require('./sim.js'); const B={acqua:1,meteorite:1,piante:['muschio','felce','fungo']};
const SC=[
 ['formiche mezza luce statuina',{...B,luce:1,insetti:['formiche'],oggetti:['statuina']}],
 ['formiche sole orologio',{...B,luce:2,insetti:['formiche'],oggetti:['orologio']}],
 ['formiche ombra',{...B,luce:0,insetti:['formiche'],oggetti:[]}],
 ['mosche acqua tanta',{luce:1,acqua:2,meteorite:1,piante:['muschio','fungo'],insetti:['mosche'],oggetti:[]}],
 ['formiche+termiti moneta',{...B,luce:1,insetti:['formiche','termiti'],oggetti:['moneta']}],
 ['lumache sole (si spengono)',{...B,luce:2,insetti:['lumache'],oggetti:[]}],
 ['coleotteri mezza luce',{...B,luce:1,insetti:['coleotteri'],oggetti:[]}],
];
for(const [n,su] of SC){ const days=[],fin={}; let stuck=0; const N=60;
  for(let i=0;i<N;i++){ const g=S.createSim(su,{seed:300+i,game:true,decisions:true}); let real=0; while(!g.finalePending&&real<60){ real++; for(let k=0;k<4;k++){ const r=g.step(); if(r.paused){ const p=g.pending[0]; g.resolve(p.id,p.type==='mutazione'?'proteggi':(i%2?'mostrati':'nascosto')); k--; } } }
    if(g.finalePending){ days.push(real); fin[g.finalePending.finale]=(fin[g.finalePending.finale]||0)+1; } else stuck++; }
  days.sort((a,b)=>a-b); const med=days.length?days[Math.floor(days.length/2)]:'—';
  console.log(n.padEnd(30),'finale entro 60 gg reali:',days.length+'/'+N,'· mediana',med,'gg reali · min',days[0],'max',days[days.length-1],JSON.stringify(fin)); }
