# QA piante vive: stati forzati del microclima → schermate in screenshots/piante/ e numeri di prestazione
# uso: python3 qa_piante.py   (nel cloud: python3 /tmp/claude-0/runner/run_local3d.py qa_piante.py)
from playwright.sync_api import sync_playwright
import os, json, sys
os.makedirs('screenshots/piante',exist_ok=True)
PIANTE=['muschio','felce','succulenta','fungo','carnivora']
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1); ctx.add_init_script("window.__fast=true"); ctx.set_default_timeout(120000); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300])); pg.on('console',lambda m: errs.append('CON '+m.text[:300]) if m.type=='error' else None)
    pg.goto('file://'+os.path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:%s,insetti:['formiche'],oggetti:[]}); __app.G.settings.tempo='giorno'; __ui.mode='game'; __ui.tab='vaso'; __ui.render()"%json.dumps(PIANTE)); pg.wait_for_timeout(300)
    pg.evaluate("__vase.set3d(true)"); pg.wait_for_function("__vase.is3d&&window.__v3d&&__v3d.piante",timeout=30000); pg.evaluate("__ui.render()"); pg.wait_for_timeout(2500)
    print('micro:',pg.evaluate("JSON.stringify((__app.micro()||{}).piante)"))
    print('triangoli per pianta (geometria, senza ombre):',pg.evaluate("JSON.stringify(Object.fromEntries(Object.values(__v3d.piante.objs).map(o=>[o.id,o.meshes.reduce((a,m)=>a+Math.round((m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3)*(m.count||1),0)])))"))
    def shot(name,forced,wait=1200,cam="__v3d.zoomTo({kind:'centro'})"):
        pg.evaluate("(f)=>{ __v3d.piante.force(f); __v3d.piante.settle(); }",forced); pg.evaluate(cam); pg.wait_for_timeout(wait)
        pg.screenshot(path=f'screenshots/piante/{name}.png',clip=pg.locator('#vb').bounding_box())
        print(name,pg.evaluate("JSON.stringify(__v3d.info)"),pg.evaluate("JSON.stringify(window.__v3dT)"))
    ALL=lambda **k:{p:dict(k) for p in PIANTE}
    ZP=lambda id:"__v3d.zoomTo({kind:'pianta',id:'%s'})"%id
    shot('01_germoglio',ALL(vigore=.85,crescita=8,superficie=.8,terriccio=.7,rh=.95))
    shot('02_giovane',ALL(vigore=.85,crescita=110,superficie=.8,terriccio=.7,rh=.95))
    shot('03_adulta',ALL(vigore=.95,crescita=400,superficie=.9,terriccio=.75,rh=.95,aperto=False))
    shot('03b_adulta_home',ALL(vigore=.95,crescita=400,superficie=.9,terriccio=.75,rh=.95),cam="__v3d.zoomTo(null)")
    for pid in PIANTE:
        shot(f'10_{pid}_germoglio',ALL(vigore=.85,crescita=30,superficie=.8,terriccio=.7,rh=.95),cam=ZP(pid))
        shot(f'11_{pid}_adulta',ALL(vigore=.95,crescita=400 if pid!='fungo' else 26,superficie=.9,terriccio=.75,rh=.95),cam=ZP(pid))
        shot(f'12_{pid}_appassita',ALL(vigore=.2,crescita=400 if pid!='fungo' else 52,superficie=0,terriccio=.1,rh=.5),cam=ZP(pid))
    shot('05_marcio_ristagno',ALL(vigore=.25,crescita=400,superficie=.9,terriccio=1,rh=.98,ristagno=.9),cam=ZP('succulenta'))
    shot('06_muschio_secco',ALL(vigore=.35,crescita=400,superficie=0,terriccio=.15,rh=.5),cam=ZP('muschio'))
    # bagno: la superficie si riempie subito, il vigore resta basso → il muschio si riapre in pochi secondi
    pg.evaluate("(f)=>__v3d.piante.force(f)",ALL(vigore=.35,crescita=400,superficie=.95,terriccio=.6,rh=.9)); pg.wait_for_timeout(1500)
    pg.screenshot(path='screenshots/piante/07a_muschio_bagnato_1s.png',clip=pg.locator('#vb').bounding_box()); pg.wait_for_timeout(5000)
    pg.screenshot(path='screenshots/piante/07_muschio_bagnato_6s.png',clip=pg.locator('#vb').bounding_box()); print('muschio dopo acqua',pg.evaluate("JSON.stringify(__v3d.piante.state().muschio)"))
    shot('08_funghi_pioggia',{**ALL(vigore=.9,crescita=400,superficie=.9,terriccio=.9,rh=.98),'fungo':dict(vigore=.9,crescita=26,rh=.98,terriccio=.9)},cam=ZP('fungo'))
    shot('09_funghi_appassiti',{**ALL(vigore=.9,crescita=400,superficie=.9,terriccio=.9,rh=.98),'fungo':dict(vigore=.9,crescita=50,rh=.98,terriccio=.9)},cam=ZP('fungo'))
    # prestazioni: media di 60 fotogrammi con tutte le piante adulte e vento (tappo aperto), vista di casa
    pg.evaluate("(f)=>{ __v3d.piante.force(f); __v3d.piante.settle(); __v3d.zoomTo(null); }",ALL(vigore=.95,crescita=400,superficie=.9,terriccio=.75,rh=.95,aperto=True)); pg.wait_for_timeout(1500)
    t=pg.evaluate("""() => new Promise(res=>{ const L=[],R=[]; let n=0; const f=()=>{ if(window.__v3dT){ L.push(__v3dT.logic); R.push(__v3dT.render); } if(++n<60) requestAnimationFrame(f); else res({logic:L.reduce((a,b)=>a+b,0)/L.length, render:R.reduce((a,b)=>a+b,0)/R.length, info:__v3d.info}); }; requestAnimationFrame(f); })""")
    print('prestazioni (swiftshader, 60 fotogrammi, casa):',json.dumps(t))
    print('errori:',errs[:8] or 'nessuno'); b.close()
