// Normalizza un asset generato: assi del gioco (avanti +X, su +Y), scala reale, appoggio a y=0, materiali organici non metallici.
// Uso: node normalize.mjs in.glb out.glb --len 0.20 --rot "0.7071,0.7071,0,0" [--organic] [--core 0.06]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const a=process.argv.slice(2), inp=a[0], out=a[1], opt=k=>{ const i=a.indexOf('--'+k); return i<0?null:(a[i+1]&&!a[i+1].startsWith('--')?a[i+1]:true); };
const L=parseFloat(opt('len')||'0.2'), q=(opt('rot')||'0,0,0,1').split(',').map(Number), core=parseFloat(opt('core')||'0.06'), organic=!!opt('organic');
const rot=([x,y,z])=>{ const [qx,qy,qz,qw]=q, tx=2*(qy*z-qz*y), ty=2*(qz*x-qx*z), tz=2*(qx*y-qy*x); return [x+qw*tx+(qy*tz-qz*ty), y+qw*ty+(qz*tx-qx*tz), z+qw*tz+(qx*ty-qy*tx)]; };
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS), doc=await io.read(inp), root=doc.getRoot();
const prims=root.listMeshes().flatMap(m=>m.listPrimitives());
let P=[]; prims.forEach(p=>{ const a=p.getAttribute('POSITION'); for(let i=0;i<a.getCount();i++) P.push(rot(a.getElement(i,[]))); });
// lunghezza del corpo: vertici vicini all'asse centrale (|z| piccolo), esclude zampe divaricate
const corpo=P.filter(v=>Math.abs(v[2])<core); let mn=Infinity,mx=-Infinity; corpo.forEach(v=>{ if(v[0]<mn) mn=v[0]; if(v[0]>mx) mx=v[0]; });
const s=L/(mx-mn); let minY=Infinity, cx=0,cz=0; P.forEach(v=>{ if(v[1]*s<minY) minY=v[1]*s; cx+=v[0]; cz+=v[2]; }); cx=cx/P.length*s; cz=cz/P.length*s;
prims.forEach(p=>{ const a=p.getAttribute('POSITION'), n=p.getAttribute('NORMAL'), arr=a.getArray().slice(); for(let i=0;i<a.getCount();i++){ const v=rot(a.getElement(i,[])); arr[i*3]=v[0]*s-cx; arr[i*3+1]=v[1]*s-minY; arr[i*3+2]=v[2]*s-cz; } a.setArray(arr);
  if(n){ const na=n.getArray().slice(); for(let i=0;i<n.getCount();i++){ const v=rot(n.getElement(i,[])); na.set(v,i*3); } n.setArray(na); } });
root.listNodes().forEach(nd=>{ nd.setTranslation([0,0,0]); nd.setRotation([0,0,0,1]); nd.setScale([1,1,1]); });
if(organic) root.listMaterials().forEach(m=>{ m.setMetallicFactor(0); });
await io.write(out,doc);
let b=[[1e9,1e9,1e9],[-1e9,-1e9,-1e9]]; prims.forEach(p=>{ const a=p.getAttribute('POSITION'); for(let i=0;i<a.getCount();i++){ const v=a.getElement(i,[]); for(let k=0;k<3;k++){ b[0][k]=Math.min(b[0][k],v[k]); b[1][k]=Math.max(b[1][k],v[k]); } } });
console.log(out,'· corpo',(mx-mn).toFixed(3),'→',L,'· scala',s.toFixed(4),'· ingombro',b[1].map((x,k)=>(x-b[0][k]).toFixed(3)).join(' × '),'· y min',b[0][1].toFixed(4));
