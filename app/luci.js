// Luci di Terrario: tutte le luci, tone mapping, esposizione, ombre e ambiente vivono qui (contratto «Luci» in docs/CONTRATTI.md).
// window.__LUCI(THREE,{scene,renderer,camera}) -> {set(tempo), update(dt), level(n), dispose()}
//   tempo: 'giorno' | 'sera' | 'notte' · level: 0 pieno · 1 ridotto · 2 minimo (guardia prestazioni)
// Luci guidate dal gioco (non fanno parte del contratto minimo, le pilota v3d.js):
//   meteora(y,k)  luce viola del sasso all'altezza y con intensità di base k
//   fuoco(k,x,y,z) bagliore del fuoco di un insediamento (k=0 spento)
(function(){
'use strict';
window.__LUCI=function(THREE,o){
  const scene=o.scene, renderer=o.renderer;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
  // ambiente (riflessi del vetro e luce diffusa)
  const pm=new THREE.PMREMGenerator(renderer);
  (function(){ const c=document.createElement('canvas'); c.width=256; c.height=128; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,128); gr.addColorStop(0,'#cfe3ff'); gr.addColorStop(.5,'#f2e6d2'); gr.addColorStop(1,'#4a382a'); g.fillStyle=gr; g.fillRect(0,0,256,128); g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(40,18,52,26); g.fillRect(172,28,34,18); const t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping; t.colorSpace=THREE.SRGBColorSpace; scene.environment=pm.fromEquirectangular(t).texture; if(window.__TEX&&window.__TEX.bg_day) new THREE.TextureLoader().load(window.__TEX.bg_day,et=>{ et.mapping=THREE.EquirectangularReflectionMapping; et.colorSpace=THREE.SRGBColorSpace; scene.environment=pm.fromEquirectangular(et).texture; }); })();
  const hemi=new THREE.HemisphereLight(0xdbe8f5,0x5a4636,.9); scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd9a8,2.8); sun.position.set(2.4,5.5,2.6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-2.2,right:2.2,top:3,bottom:-1.2,near:.5,far:16}); sun.shadow.bias=-.0006; sun.shadow.normalBias=.02; scene.add(sun);
  const fill=new THREE.DirectionalLight(0xbcd2ff,.6); fill.position.set(-3,2,2); scene.add(fill);
  const metLight=new THREE.PointLight(0xa68bff,0,2.6,2); scene.add(metLight);
  const fireLight=new THREE.PointLight(0xff9a40,0,2.2,2); scene.add(fireLight);
  // ombra di contatto sotto il vaso
  const sc=document.createElement('canvas'); sc.width=sc.height=128; const sg=sc.getContext('2d'); const rg=sg.createRadialGradient(64,64,10,64,64,62); rg.addColorStop(0,'rgba(0,0,0,.55)'); rg.addColorStop(1,'rgba(0,0,0,0)'); sg.fillStyle=rg; sg.fillRect(0,0,128,128);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.004; scene.add(sh);
  let night=false, lv=0;
  function set(tempo){ night=tempo==='notte'; hemi.intensity=night?.38:.9; sun.intensity=night?.5:2.8; sun.color.set(night?0x8fa6ff:0xffd9a8); fill.intensity=night?.25:.6; }
  function level(n){ n=n|0; if(n===lv) return; lv=n; renderer.shadowMap.enabled=n<1; scene.traverse(x=>{ if(x.material) x.material.needsUpdate=true; }); }
  function update(dt){}
  function meteora(y,k){ metLight.position.set(0,y,0); metLight.intensity=k*(night?1.1:1); }
  function fuoco(k,x,y,z){ if(k>0&&x!==undefined) fireLight.position.set(x,y,z); fireLight.intensity=k*(night?1.6:1); }
  function dispose(){ [hemi,sun,fill,metLight,fireLight,sh].forEach(x=>scene.remove(x)); sh.geometry.dispose(); sh.material.map.dispose(); sh.material.dispose(); pm.dispose(); if(window.__luci===api) window.__luci=null; }
  const api={set,update,level,dispose,meteora,fuoco};
  window.__luci=api; return api;
};
})();
