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
    pg.click('.f-gate'); pg.wait_for_timeout(900); t('cielo',sc()=='cielo',sc()); shot('01_cielo')
    a=an(); t('ancora della stella',a and a['star'] and 0<a['star']['x']<VW*DSF and 0<a['star']['y']<VH*DSF,a)
    tap(a['star']); pg.wait_for_timeout(120); t('la stella reagisce al PRIMO tocco',pg.evaluate("__film.scene")=='cielo' and pg.evaluate("document.querySelector('.f-hint').style.opacity")in('0',''),'')
    pg.wait_for_timeout(120); shot('02_caduta'); pg.wait_for_timeout(1000)
    t('la stella cade → giardino',sc()=='giardino',sc()); pg.wait_for_timeout(600); shot('03_giardino')
    a=an(); t('ancora del sasso',a and a['stone'],a)
    pg.mouse.move(a['stone']['x']/K(),a['stone']['y']/K()); pg.mouse.down(); pg.wait_for_timeout(60); pg.mouse.up(); pg.wait_for_timeout(300)
    t('mollato presto: l’invito «Tieni premuto» torna',pg.inner_text('.f-hint').strip()=='Tieni premuto sul sasso' and sc()=='giardino',pg.inner_text('.f-hint'))
    pg.mouse.move(a['stone']['x']/K(),a['stone']['y']/K()); pg.mouse.down(); pg.wait_for_timeout(150); shot('04_tieni_premuto'); pg.wait_for_timeout(350); pg.mouse.up(); pg.wait_for_timeout(1000)
    t('tenere premuto → barattolo',sc()=='barattolo',sc()); pg.wait_for_timeout(700); shot('05_barattolo')
    a=an(); s=a['stone']; j=a['jar']
    k=K(); pg.mouse.move(s['x']/k,s['y']/k); pg.mouse.down(); pg.mouse.move(j['cx']/k,(j['y0']+j['jh']*.1)/k,steps=8); pg.mouse.move(j['cx']/k,(j['y0']+j['jh']*.4)/k,steps=8); pg.wait_for_timeout(100); shot('06_trascina'); pg.mouse.up(); pg.wait_for_timeout(500); shot('07_dentro'); pg.wait_for_timeout(1200)
    t('sasso nel barattolo → scelta luce',sc()=='luce',sc()); pg.wait_for_timeout(500); shot('08_luce')
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
