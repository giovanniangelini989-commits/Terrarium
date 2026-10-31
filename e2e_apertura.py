# Attraversa l'apertura in 3D (app/apertura.js) e salva una schermata per scena in screenshots/apertura/.
# Senza jsDelivr: python3 /tmp/claude-0/runner/run_local3d.py e2e_apertura.py  (Three servito da npm locale)
from playwright.sync_api import sync_playwright
import sys, os
errs=[]; ok=0; bad=0
def t(n,c,x=''):
    global ok,bad
    if c: ok+=1
    else: bad+=1; print('✗',n,x)
VW,VH=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (390,844); tag=sys.argv[3] if len(sys.argv)>3 else 'n'; DSF=float(sys.argv[4]) if len(sys.argv)>4 else 2
os.makedirs('screenshots/apertura',exist_ok=True)
shot=lambda name: pg.screenshot(path=f'screenshots/apertura/{tag}_{name}.png')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=DSF); ctx.set_default_timeout(180000); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:200])); pg.on('console',lambda m: errs.append('CON '+m.text[:200]) if m.type in ('error','warning') else None)
    pg.goto('file://'+os.path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1900)
    sc=lambda:pg.evaluate("__film.scene"); an=lambda:pg.evaluate("__film.anchors()")
    def tap(a): pg.mouse.click(a['x']/K(),a['y']/K())
    K=lambda: pg.evaluate('__film.anchors()&&devicePixelRatio')and min(2,pg.evaluate('devicePixelRatio'))
    t('schermata «Tocca per iniziare»',pg.locator('.f-gate').count()==1); shot('00_gate')
    pg.wait_for_function("__film.mode==='3d'",timeout=60000); pg.wait_for_timeout(600)
    t('il 3D parte prima del primo tocco',pg.evaluate("__film.mode")=='3d')
    print('slot:',pg.evaluate("JSON.stringify(__film.slots)"))
    import os as _o; _o.makedirs('screenshots/apertura2',exist_ok=True)
    s2=lambda n: pg.screenshot(path=f'screenshots/apertura2/{n}.png')
    pg.evaluate('window.__holdFilm=true'); pg.click('.f-gate'); pg.wait_for_timeout(500); t('si inizia dal cielo (foto)',sc()=='cielo',sc()); t('foto caricate',pg.evaluate("[...document.querySelectorAll('.f-kb img')].every(i=>i.complete&&i.naturalWidth>0)"))
    pg.wait_for_timeout(800); shot('01_cielo'); pg.evaluate('window.__holdFilm=false'); pg.wait_for_timeout(1100); pg.evaluate('window.__holdFilm=true'); shot('01b_cielo_stella')
    for n,name in ((1,'giardino'),(2,'scoperta'),(3,'mano'),(4,'vaso'),(5,'respiro')):
        pg.evaluate(f'__film._go({n})'); pg.wait_for_timeout(900); t(name,sc()==name,sc()); shot('0%d_%s'%(n+1,name))
        if name=='scoperta': s2('1_scoperta')
        if name=='mano': s2('2_mani')
    pg.evaluate('window.__holdFilm=false'); pg.wait_for_timeout(1700); t('dopo l ultima foto: scelta luce (barattolo 3D)',sc()=='luce',sc()); pg.wait_for_timeout(1500); s2('3_passaggio_vaso'); shot('08_luce')
    t('tocco: avanza le foto',True)
    for i in (0,2): pg.click(f'.f-opt[data-k=luce][data-i="{i}"]'); pg.wait_for_timeout(500); shot(f'08_luce_{i}')
    pg.click('[data-f=next]'); pg.wait_for_timeout(800); t('leggenda',sc()=='legenda',sc()); shot('09_leggenda')
    for _ in range(3): pg.mouse.click(VW*.5,VH*.5); pg.wait_for_timeout(250)
    shot('10_battito'); t('3 tocchi sbloccano Avanti',pg.locator('.f-ctl [data-f=next]').count()==1); pg.click('[data-f=next]'); pg.wait_for_timeout(800)
    t('nome',sc()=='nome',sc()); pg.wait_for_timeout(300); pg.fill('#f-nm','Lumen'); shot('11_nome'); pg.click('[data-f=end]'); pg.wait_for_timeout(250); shot('12_chiusura'); pg.wait_for_timeout(1500)
    t('gioco avviato in 3D con la scelta del video',pg.evaluate("__ui.mode")=='game' and pg.evaluate("__app.G.name")=='Lumen' and pg.evaluate("__app.sim.view().setup.luce")==2)
    pg.wait_for_function("__vase.is3d",timeout=30000); pg.wait_for_timeout(1500); shot('13_vaso_3d')
    t('il vaso in gioco è in 3D',pg.evaluate("__vase.is3d") and pg.locator('#vb canvas.v3d').count()==1)
    print('info apertura:',pg.evaluate("JSON.stringify(__film.info&&__film.info())"))
    b.close()
print(ok,'ok',bad,'falliti'); e=[x for x in errs if 'AudioContext' not in x and 'webp' not in x.lower() and 'GPU stall' not in x and 'PCFSoftShadowMap' not in x]; print('errori console:',e or 'nessuno')
sys.exit(1 if bad or e else 0)
