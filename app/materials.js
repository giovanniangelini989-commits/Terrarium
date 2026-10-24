/* Libreria materiali Terrario — stessi id del brief Kimi v2 (§3). Possediamo noi i materiali: i modelli indicano solo lo slot. */
window.__MATLIB=function(THREE){
  const P=o=>new THREE.MeshPhysicalMaterial(o), Sd=o=>new THREE.MeshStandardMaterial(o);
  const DEF={
    0:['chitina',()=>P({color:0x3a2a20,roughness:.32,clearcoat:.6,clearcoatRoughness:.2,vertexColors:true})],
    1:['chitina_opaca',()=>Sd({color:0xd9c39a,roughness:.6,vertexColors:true})],
    2:['occhio_composto',()=>P({color:0x7a1a14,roughness:.15,clearcoat:1})],
    3:['ala',()=>P({color:0xdfe8ff,roughness:.1,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false})],
    4:['conchiglia',()=>P({color:0xb07a46,roughness:.4,clearcoat:.5,vertexColors:true})],
    5:['pelle_umida',()=>P({color:0x9a8c7a,roughness:.25,clearcoat:.8,vertexColors:true})],
    6:['peluche',()=>P({color:0x9a6a44,roughness:1,sheen:1,sheenRoughness:.75,sheenColor:new THREE.Color(0xf0d0a8),vertexColors:true})],
    7:['plastica_lucida',()=>P({color:0x120c0a,roughness:.12,clearcoat:1,clearcoatRoughness:.05})],
    8:['ottone',()=>Sd({color:0xc9a24a,metalness:1,roughness:.32,vertexColors:true})],
    9:['metallo_brunito',()=>Sd({color:0x3a3530,metalness:1,roughness:.45})],
    10:['argento',()=>Sd({color:0xd9d6d0,metalness:1,roughness:.25,vertexColors:true})],
    11:['smalto',()=>P({color:0xf1ebdc,roughness:.15,clearcoat:.8,vertexColors:true})],
    12:['vetro_sottile',()=>P({color:0x000000,transparent:true,blending:THREE.AdditiveBlending,roughness:.05,clearcoat:.5,depthWrite:false})],
    13:['specchio',()=>Sd({color:0xe6ecef,metalness:1,roughness:.04})],
    14:['legno_lucido',()=>P({color:0x6b4426,roughness:.45,clearcoat:.5,vertexColors:true})],
    15:['pelle',()=>Sd({color:0x5a2a1e,roughness:.7,vertexColors:true})],
    16:['carta',()=>Sd({color:0xe9dfc6,roughness:.95,vertexColors:true})],
    17:['tessuto',()=>P({color:0x4a4f48,roughness:1,sheen:.6,sheenColor:new THREE.Color(0x9aa39a),vertexColors:true})],
    18:['cera',()=>P({color:0xf0e2c4,roughness:.55,sheen:.3,sheenColor:new THREE.Color(0xfff2d8),vertexColors:true})],
    19:['fiamma',()=>new THREE.MeshBasicMaterial({color:0xffb04a,toneMapped:false})],
    20:['pietra',()=>Sd({color:0xb8ad9c,roughness:.85,vertexColors:true})],
    21:['ceramica',()=>P({color:0xd8cfc0,roughness:.3,clearcoat:.4,vertexColors:true})]
  };
  const ID={}; Object.keys(DEF).forEach(k=>ID[DEF[k][0]]=+k);
  const cache={}; const mat=slot=>{ const id=typeof slot==='number'?slot:ID[slot]; if(!(id in DEF)) return null; return cache[id]||(cache[id]=DEF[id][1]()); };
  // Compatibilità pass 1: colori usati da Kimi → slot (si toglie quando arriva aMat)
  const OBJMAP={
    statuina:{'#42392b':'pietra','#0d0c0a':'pietra','#2d281f':'pietra'},
    orologio:{'#19130b':'metallo_brunito','#643d14':'ottone','#ad9f77':'smalto','#20150b':'metallo_brunito','#0d0b08':'metallo_brunito'},
    giocattolo:{'#522e17':'peluche','#7c522c':'peluche','#100a07':'plastica_lucida','#2a180d':'plastica_lucida'},
    specchio:{'#543a17':'ottone','#6f501f':'ottone','#90a3a3':'specchio'},
    libro:{'#564933':'pelle','#291610':'pelle','#958560':'carta','#130d0a':'pelle','#60431d':'ottone'},
    moneta:{'#734a14':'argento','#a17a28':'argento','#2e1d09':'argento'},
    radio:{'#705229':'legno_lucido','#3e473f':'tessuto','#212a25':'tessuto','#090c0a':'metallo_brunito','#a4905c':'ottone','#251b0e':'legno_lucido','#0e1210':'metallo_brunito','#464e47':'tessuto'},
    candela:{'#ad8d55':'cera','#826436':'ottone','#0b0805':'metallo_brunito','#ff8d25':'fiamma'}
  };
  const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
  const lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2];
  function dress(group,objId){ const map=OBJMAP[objId]; if(!map) return group; const keys=Object.keys(map).map(h=>({h,c:rgb(h),slot:map[h]}));
    group.traverse(m=>{ if(!m.isMesh) return; const g=m.geometry, col=g.attributes.color; if(!col) return; if(!g.index){ const a=[]; for(let i=0;i<g.attributes.position.count;i++) a.push(i); g.setIndex(a); }
      const idx=g.index.array, tri=idx.length/3, bySlot={}, near=i=>{ const c=[col.getX(i),col.getY(i),col.getZ(i)]; let best=keys[0], bd=1e9; keys.forEach(k=>{ const d=(k.c[0]-c[0])**2+(k.c[1]-c[1])**2+(k.c[2]-c[2])**2; if(d<bd){ bd=d; best=k; } }); return best; };
      const shade=new Float32Array(col.count*3);
      for(let t=0;t<tri;t++){ const k=near(idx[t*3]); (bySlot[k.slot]=bySlot[k.slot]||[]).push(idx[t*3],idx[t*3+1],idx[t*3+2]); }
      for(let i=0;i<col.count;i++){ const k=near(i), c=[col.getX(i),col.getY(i),col.getZ(i)], f=Math.max(.45,Math.min(1.25,lum(c)/Math.max(.02,lum(k.c)))); shade[i*3]=shade[i*3+1]=shade[i*3+2]=f; }
      g.setAttribute('color',new THREE.BufferAttribute(shade,3)); const order=Object.keys(bySlot), ni=[], mats=[]; g.clearGroups();
      order.forEach((s,j)=>{ g.addGroup(ni.length,bySlot[s].length,j); ni.push(...bySlot[s]); mats.push(mat(s)); }); g.setIndex(ni); m.material=mats.length===1?mats[0]:mats; });
    return group; }
  return {DEF,ID,mat,dress,OBJMAP};
};
