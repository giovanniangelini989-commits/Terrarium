from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page()
    def vbshot(path):
        bx=pg.locator('#vb').bounding_box(); pg.screenshot(path=path,clip=bx)
    errs=[]; pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:250])); pg.on('console',lambda m:errs.append('CON '+m.text[:200]) if m.type in('error','warning') else None)
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1900)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:[],insetti:[],oggetti:[]}); __ui.mode='game'; __ui.render()"); pg.wait_for_timeout(400)
    ok=pg.evaluate("__vase.set3d(true)"); print('3D attivata:',ok)
    pg.evaluate("__ui.render()"); pg.wait_for_timeout(1800)
    def shot(n): pg.wait_for_timeout(900); vbshot(path=f'v3_{n}.png')
    shot('0_vuoto')
    pg.evaluate("__app.doAct('terra'); __app.doAct('acqua'); __app.popups.length=0; __ui.closeSheet&&__ui.closeSheet(); __ui.render()"); shot('1_terra')
    pg.evaluate("(()=>{ const A=__app; A.G.ui.fase=5; A.sim.addPlant('muschio'); A.sim.addPlant('felce'); A.sim.addPlant('fungo'); A.sim.addSpecies('formiche'); A.sim.addSpecies('coleotteri'); A.sim.addObject('statuina'); A.sim.act('acqua'); A.sim.act('acqua'); A.sim.act('nutri'); __ui.render(); })()"); shot('2_vita')
    pg.evaluate("""(cult)=>{ const A=__app; if(!A.__orig) A.__orig=A.sim.view.bind(A.sim); A.sim.view=()=>{ const v=A.__orig(); v.d=100; v.sp=v.sp.map((x,k)=>k===0?Object.assign({},x,{pop:60,society:{name:'Formiche prova',cult,since:100-30,culto:'giocatore'}}):x); return v; }; }""","sacro"); shot('3_sacro')
    for i,c in enumerate(['commercio','fuoco','comunicazione']):
        pg.evaluate("""(cult)=>{ const A=__app; A.sim.view=()=>{ const v=A.__orig(); v.d=100; v.sp=v.sp.map((x,k)=>k===0?Object.assign({},x,{pop:60,society:{name:'Formiche prova',cult,since:100-70,culto:null}}):x); return v; }; }""",c); shot(f'4_{c}')
    pg.evaluate("""()=>{ const A=__app; A.sim.view=()=>{ const v=A.__orig(); v.d=100; v.needs={um:.02,ter:.1,pul:.4}; v.muffa=.6; return v; }; }"""); shot('5_secco')
    pg.evaluate("__vase.zoomTo({kind:'specie',id:'formiche'})"); shot('6_zoom')
    print('gruppi',pg.evaluate("JSON.stringify(Object.keys(__vase.groups))"),'· is3d',pg.evaluate("__vase.is3d"),'· info',pg.evaluate("JSON.stringify(window.__v3d.info)")); print(errs[:6] or 'nessun errore'); b.close()
names=['0_vuoto','1_terra','2_vita','3_sacro','4_commercio','4_fuoco','4_comunicazione','5_secco','6_zoom']
ims=[Image.open(f'v3_{n}.png') for n in names]; w,h=ims[0].size
W=Image.new('RGB',(w//2*3,h//2*3))
for i,im in enumerate(ims):
    im=im.resize((w//2,h//2)); W.paste(im,((i%3)*(w//2),(i//3)*(h//2))); ImageDraw.Draw(W).text(((i%3)*(w//2)+6,(i//3)*(h//2)+6),names[i],fill=(255,255,255))
W.save('m_3d.png')
