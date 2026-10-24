from playwright.sync_api import sync_playwright
import sys
errs=[]; ok=0; bad=0
def t(n,c,x=''):
    global ok,bad
    if c: ok+=1
    else: bad+=1; print('✗',n,x)
VW,VH=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (390,844); tag=sys.argv[3] if len(sys.argv)>3 else 'n'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=2); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page()
    def vbshot(path):
        bx=pg.locator('#vb').bounding_box(); pg.screenshot(path=path,clip=bx)
    def goto(t): pg.evaluate("(t)=>{ __ui.tab=t; __ui.render(); }",t); pg.wait_for_timeout(120)
    pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:200])); pg.on('console',lambda m: errs.append('CON '+m.text[:160]) if m.type=='error' else None)
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1900)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche','coleotteri'],oggetti:['statuina']}); __app.G.settings.tempo='giorno'; __ui.mode='game'; __ui.render()"); pg.wait_for_timeout(500)
    def menu3d(): pg.click('[data-a=menu]'); pg.wait_for_timeout(150); pg.click('[data-a=menu-go][data-g=v3d]')
    t('parte in 2D e il menu propone la vista 3D',not pg.evaluate("__vase.is3d"))
    menu3d(); pg.wait_for_function("__vase.is3d",timeout=20000); pg.wait_for_timeout(1500)
    t('toccando «3D» si carica Three.js e compare la vista 3D',pg.evaluate("__vase.is3d") and pg.locator('#vb canvas.v3d').count()==1 ); vbshot(path=f'screenshots/{tag}_3d_giorno.png')
    t('la scelta 3D è salvata',pg.evaluate("__app.G.settings.v3d")==True)
    t('la vista 3D è leggera (< 40.000 triangoli, < 200 chiamate)',pg.evaluate("window.__v3d.info.tris")<40000 and pg.evaluate("window.__v3d.info.renderer")<200,pg.evaluate("JSON.stringify(window.__v3d.info)"))
    gid=pg.evaluate("__app.sim.view().sp.find(x=>x.alive).id"); pos=pg.evaluate(f"__vase.screenOf('{gid}')"); t('si trova la posizione a schermo di un gruppo',pos is not None and 0<pos['x']<VW and 0<pos['y']<VH,pos)
    pg.mouse.click(pos['x'],pos['y']); pg.wait_for_timeout(500); t('toccando il gruppo nel 3D si apre la scheda',pg.locator('.sheet').count()==1,pos); pg.screenshot(path=f'screenshots/{tag}_3d_scheda.png'); pg.click('.sheet [data-a=sx]'); pg.wait_for_timeout(300)
    box=pg.locator('#vb canvas.v3d').bounding_box(); cx,cy=box['x']+box['width']*.5,box['y']+box['height']*.3
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.mouse.move(cx+90,cy+10,steps=8); pg.mouse.up(); pg.wait_for_timeout(500)
    t('trascinando si ruota la vista senza aprire schede',pg.locator('.sheet').count()==0); vbshot(path=f'screenshots/{tag}_3d_ruotato.png')
    pg.evaluate("window.__fast=false"); pg.click('[data-a=osserva]'); pg.wait_for_timeout(2000)
    t('lo zoom cinematografico mostra la ciotola 3D',pg.locator('#cine .cstage canvas.v3d').count()==1); pg.screenshot(path=f'screenshots/{tag}_3d_cinema.png'); pg.wait_for_selector('#cine',state='detached',timeout=30000); pg.wait_for_timeout(900); pg.evaluate("window.__fast=true")
    t('finito lo zoom la vista 3D torna nella home',pg.locator('#cine').count()==0 and pg.locator('#vb canvas.v3d').count()==1)
    pg.evaluate(f"__vase.bubble('{gid}','✨')"); pg.wait_for_timeout(500); vbshot(path=f'screenshots/{tag}_3d_bolla.png')
    menu3d(); pg.wait_for_timeout(600); t('si può tornare al 2D',not pg.evaluate("__vase.is3d") and pg.locator('#vb canvas.v3d').count()==0 and pg.locator('#vb canvas').count()==1)
    menu3d(); pg.wait_for_function("__vase.is3d",timeout=20000); pg.wait_for_timeout(600); t('e ripassare al 3D',pg.locator('#vb canvas.v3d').count()==1)
    pg.evaluate("window.__tried3=0"); pg.reload(); pg.wait_for_timeout(3500); t('dopo il ricaricamento il 3D si riattiva da solo',pg.evaluate("__vase.is3d") and pg.locator('#vb canvas.v3d').count()==1)
    pg.evaluate("(()=>{ const A=__app; A.G.dev.offset+=3; A.checkNewDay(); A.popups.length=0; while(A.sim.pending.length){ const p=A.sim.pending[0]; A.resolveDecision(p.id,'proteggi'); } __ui.render(); })()"); pg.wait_for_timeout(1200); t('il 3D regge i giorni che passano',pg.evaluate("__vase.is3d")); vbshot(path=f'screenshots/{tag}_3d_dopo.png')
    print('overflow orizzontale:',pg.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
    b.close()
print(ok,'ok',bad,'falliti'); print('errori console:',[e for e in errs if 'AudioContext' not in e] or 'nessuno')
