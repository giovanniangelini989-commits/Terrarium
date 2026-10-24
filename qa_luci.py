# QA delle luci: schermate a camera fissa (giorno, sera, notte, zoom) + numeri di prestazione.
# Uso: python3 qa_luci.py [cartella_uscita] [pagina.html]   (default screenshots/luci, dist/terrario-gioco.html)
# Se esiste /tmp/claude-0/three/package, Three.js viene servito da lì (sessioni senza jsDelivr).
from playwright.sync_api import sync_playwright
import os, sys, json, math
OUT=sys.argv[1] if len(sys.argv)>1 else 'screenshots/luci'; os.makedirs(OUT,exist_ok=True)
PAGE=sys.argv[2] if len(sys.argv)>2 else 'dist/terrario-gioco.html'
B='/tmp/claude-0/three/package'
INIT="""
(function(){ let s=12345; Math.random=function(){ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
 const D=new EventTarget(); window.__THREE_DEVTOOLS__=D; window.__cap={};
 D.addEventListener('observe',e=>{ const o=e.detail; if(o&&o.isScene){ if(!__cap.scene) __cap.scene=o; } else if(o&&o.render&&o.domElement&&!__cap.renderer){ __cap.renderer=o; const r=o.render.bind(o); o.render=function(sc,cam){ if(sc===__cap.scene&&cam&&cam.isPerspectiveCamera) __cap.camera=cam; return r(sc,cam); }; } });
})();
"""
# inquadrature fisse (come la «home» del gioco, senza l'oscillazione): [tempo, az, pol, distanza (<0 = come home()), bersaglio]
SHOTS=[('giorno','giorno',0,1.06,-1,[0,.85,0]),('sera','sera',0,1.06,-1,[0,.85,0]),('notte','notte',0,1.06,-1,[0,.85,0]),('zoom','giorno',.35,1.0,2.3,[0,.45,0])]
# camera fissa: un involucro esterno su renderer.render rimette la camera dove vogliamo prima di ogni disegno della scena
CAMHOOK="""()=>{ const R=__cap.renderer, prev=R.render; R.render=function(s,c){ const q=window.__qaCam; if(q&&s===__cap.scene&&c&&c.isPerspectiveCamera){ let [az,pol,dist,tgt]=q;
  if(dist<0){ const th=Math.tan(c.fov*Math.PI/360); dist=Math.max(2.9/(2*th),2.35/(2*th*c.aspect))*1.06*1.22; }
  c.position.set(tgt[0]+dist*Math.sin(pol)*Math.sin(az),tgt[1]+dist*Math.cos(pol),tgt[2]+dist*Math.sin(pol)*Math.cos(az)); c.lookAt(tgt[0],tgt[1],tgt[2]); c.updateMatrixWorld(); }
  return prev.call(R,s,c); }; }"""
RENDER="""(n)=>{ const R=__cap.renderer, S=__cap.scene, C=__cap.camera; const draw=()=>R.render(S,C);
  const gl=R.getContext(); draw(); gl.finish(); R.info.autoReset=false; R.info.reset(); const t0=performance.now(); for(let i=0;i<n;i++){ draw(); } const px=new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const ms=(performance.now()-t0)/n;
  const calls=Math.round(R.info.render.calls/n), tris=Math.round(R.info.render.triangles/n); R.info.autoReset=true; draw();
  return {ms:+ms.toFixed(1),calls,tris,pr:R.getPixelRatio(),w:R.domElement.width,h:R.domElement.height}; }"""
res={}
N=int(os.environ.get('QA_N','2'))   # fotogrammi misurati per inquadratura
DPR=float(os.environ.get('QA_DPR','1'))
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=DPR)
    if os.path.isdir(B):
        def h(route):
            rel=route.request.url.split('/three@0.184.0/',1)[1].split('?')[0]; f=os.path.join(B,rel)
            if os.path.exists(f): route.fulfill(path=f, content_type='application/javascript', headers={'Access-Control-Allow-Origin':'*'})
            else: route.abort()
        ctx.route('**/three@0.184.0/**',h)
    ctx.add_init_script(INIT); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page(); pg.set_default_timeout(240000); errs=[]
    pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:200])); pg.on('console',lambda m: errs.append('CON '+m.text[:200]) if m.type=='error' else None)
    pg.goto('file://'+os.path.abspath(PAGE)); pg.wait_for_timeout(1900)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('Q',{luce:1,acqua:1,meteorite:1,piante:['muschio','felce','fungo'],insetti:['formiche','coleotteri'],oggetti:['statuina']}); __app.G.settings.tempo='giorno'; __ui.mode='game'; __ui.render()"); pg.wait_for_timeout(500)
    print('carico il 3D…',flush=True); pg.evaluate("__vase.set3d(true)")
    for i in range(480):
        st=pg.evaluate("JSON.stringify({is3d:__vase.is3d,conn:!!document.querySelector('canvas.v3d'),ok:!!(__vase.is3d&&window.__cap&&__cap.camera),f:window.__cap&&__cap.renderer?__cap.renderer.info.render.frame:-1})")
        if '"ok":true' in st: break
        if i%10==0:
            print('  attendo il 3D',st,errs[:3],flush=True)
            if i: pg.evaluate("(()=>{ __ui.mode='game'; __ui.render(); return __vase.set3d(true); })()")   # a volte la tela 3D resta staccata: la rimonto
        pg.wait_for_timeout(500)
    print('3D pronto',flush=True); pg.wait_for_timeout(2500)
    pg.evaluate(CAMHOOK)
    def frames(k):   # aspetta k fotogrammi veri del gioco
        f0=pg.evaluate("__cap.renderer.info.render.frame")
        for _ in range(900):
            pg.wait_for_timeout(200)
            if pg.evaluate("__cap.renderer.info.render.frame")-f0>=k: return
    def shot(name,cam):
        pg.evaluate("q=>{ window.__qaCam=q; }",cam); frames(2)
        r=pg.evaluate(RENDER,N); res[name]=r
        pg.screenshot(path=f'{OUT}/{name}.png',clip=pg.locator('#vb').bounding_box()); print(name, json.dumps(r),flush=True)
    for name,tempo,az,pol,dist,tgt in SHOTS:
        pg.evaluate(f"__app.G.settings.tempo='{'notte' if tempo=='notte' else 'giorno'}'"); frames(5)   # il gioco legge il tempo ogni 0,25 s
        if tempo=='sera': pg.evaluate("window.__luci&&window.__luci.set('sera')")
        if name=='zoom':   # zoom sulla formica di Kimi: bersaglio = centro del gruppo delle formiche
            g=pg.evaluate("(()=>{ const g=__v3d.groups().formiche; return g?[g.x,g.y,g.z]:null; })()")
            if g: tgt=[g[0],g[1]+.02,g[2]]; az=math.atan2(g[0],g[2]) if abs(g[0])+abs(g[2])>.05 else az; dist=1.15; pol=.72
        shot(name,[az,pol,dist,tgt])
    # livelli della guardia: costo a ogni livello (inquadratura giorno)
    if pg.evaluate("!!window.__luci"):
        pg.evaluate("__app.G.settings.tempo='giorno'"); frames(5)
        for lv in (0,1,2):
            pg.evaluate(f"__luci.level({lv})"); shot(f'livello{lv}',list(SHOTS[0][2:]))
        pg.evaluate("__luci.level(0)")
    pg.evaluate("window.__qaCam=null")
    b.close()
json.dump(res,open(f'{OUT}/numeri.json','w'),indent=1)
bad=[e for e in errs if 'AudioContext' not in e]
print('errori console:',bad or 'nessuno'); sys.exit(1 if bad else 0)
