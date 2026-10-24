// Controllo d'ingresso degli asset di Terrario (brief v3, §9). Uso: node qa_gate.mjs file.glb --tier swarm|close|hero --len 0.20 [--class organic|metal|mixed] [--clips idle,walk]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const a=process.argv.slice(2), f=a[0], opt=(k,d)=>{ const i=a.indexOf('--'+k); return i<0?d:a[i+1]; };
const tier=opt('tier','close'), L=parseFloat(opt('len','0')), cls=opt('class','organic'), clips=(opt('clips','')||'').split(',').filter(Boolean);
const B={swarm:{tri:1200,tex:512,mb:.25},close:{tri:8000,tex:1024,mb:.8},hero:{tri:60000,tex:2048,mb:2.6}}[tier];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS), doc=await io.read(f), R=doc.getRoot(), out=[]; let fail=0;
const chk=(ok,name,val,bad)=>{ out.push((ok?'  ✓ ':'  ✗ ')+name+' · '+val+(ok?'':' → '+bad)); if(!ok) fail++; };
let tri=0, mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9], hasUV=true, hasN=true;
R.listMeshes().forEach(m=>m.listPrimitives().forEach(p=>{ const idx=p.getIndices(), pos=p.getAttribute('POSITION'); tri+=idx?idx.getCount()/3:pos.getCount()/3; if(!p.getAttribute('TEXCOORD_0')) hasUV=false; if(!p.getAttribute('NORMAL')) hasN=false;
  for(let i=0;i<pos.getCount();i++){ const v=pos.getElement(i,[]); for(let k=0;k<3;k++){ mn[k]=Math.min(mn[k],v[k]); mx[k]=Math.max(mx[k],v[k]); } } }));
const size=fs.statSync(f).size/1e6;
chk(tri<=B.tri,'triangoli',tri,'massimo '+B.tri+' per «'+tier+'»');
chk(size<=B.mb,'peso file',size.toFixed(2)+' MB','massimo '+B.mb+' MB');
chk(hasUV&&hasN,'UV e normali','presenti: '+(hasUV&&hasN),'servono TEXCOORD_0 e NORMAL');
chk(Math.abs(mn[1])<.002,'appoggio a terra (y min)',mn[1].toFixed(4),'deve essere 0');
const dim=mx.map((x,k)=>x-mn[k]);
if(L) chk(dim[0]>=L*.95,'lunghezza su X (avanti)',dim[0].toFixed(3),'il corpo deve misurare '+L+' su +X (antenne e zampe escluse ±5%)');
chk(dim[0]>=dim[2]*.8||tier==='swarm'&&false,'orientamento (lunghezza su X)',dim.map(x=>x.toFixed(3)).join(' × '),'la dimensione maggiore deve essere su X');
R.listNodes().forEach(n=>{ const t=n.getTranslation(), r=n.getRotation(), s=n.getScale(); const id=t.every(x=>Math.abs(x)<1e-6)&&Math.abs(r[3]-1)<1e-6&&s.every(x=>Math.abs(x-1)<1e-6); if(!n.listChildren().length&&!id&&!clips.length) chk(false,'trasformazioni applicate','nodo «'+n.getName()+'» non è identità','applica rotazione/scala ai vertici'); });
R.listTextures().forEach(t=>{ const sz=t.getSize()||[0,0]; chk(Math.max(...sz)<=B.tex,'texture «'+(t.getName()||t.getURI()||'?')+'»',sz.join('×')+' '+t.getMimeType(),'massimo '+B.tex+' px'); chk(['image/webp','image/jpeg','image/png','image/ktx2'].includes(t.getMimeType()),'formato texture',t.getMimeType(),'webp, jpeg, png o ktx2'); });
R.listMaterials().forEach(m=>{ if(cls==='organic') chk(m.getMetallicFactor()===0,'metallo nei materiali organici','metallicFactor '+m.getMetallicFactor(),'deve essere 0 (chitina, piante, pelo non sono metallo)'); });
if(clips.length){ const names=R.listAnimations().map(x=>x.getName()); clips.forEach(c=>chk(names.includes(c),'animazione «'+c+'»',names.includes(c)?'presente':'assente','richiesta per «'+tier+'»')); }
console.log((fail?'RESPINTO':'APPROVATO')+' · '+f+' · '+tier); out.forEach(x=>console.log(x)); process.exitCode=fail?1:0;
