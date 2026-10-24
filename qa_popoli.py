from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
combos=[('sacro',0),('sacro',1),('sacro',3),('sapere',2),('commercio',2),('gioco',2),('mistero',2),('comunicazione',2),('fuoco',2),('agricoltura',2),('tribale',2),('guerra',2)]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1900)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche','termiti'],oggetti:[]}); __ui.mode='game'; __ui.render(); __app.G.settings.tempo='giorno'")
    pg.wait_for_timeout(500); shots=[]
    for i,(cult,st) in enumerate(combos):
        age=[3,14,70,30][[0,1,3,2].index(st)] if st in (0,1,3,2) else 30
        pg.evaluate("""([cult,age,war])=>{ const A=__app; if(!A.__orig) A.__orig=A.sim.view.bind(A.sim); A.sim.view=()=>{ const v=A.__orig(); v.d=100; v.sp=v.sp.map((x,k)=>k===0?Object.assign({},x,{pop:60,society:{name:'Formiche prova',cult,since:100-age,culto:cult==='sacro'?'giocatore':null}}):Object.assign({},x,{pop:war?50:20,society:war?{name:'Termiti prova',cult:'guerra',since:100-age}:null})); v.wars=war?[['formiche','termiti']]:[]; return v; }; }""",[cult,age,cult=='guerra'])
        pg.wait_for_timeout(1500); pg.locator('#vb').screenshot(path=f'qa_p{i}.png'); shots.append(f'qa_p{i}.png')
    print(errs or 'nessun errore')
    b.close()
ims=[Image.open(f).resize((300,260)) for f in shots]
W=Image.new('RGB',(300*4,260*3))
for i,im in enumerate(ims):
    W.paste(im,((i%4)*300,(i//4)*260)); d=ImageDraw.Draw(W); d.text(((i%4)*300+6,(i//4)*260+6),f'{combos[i][0]} · stadio {combos[i][1]}',fill=(255,255,255))
W.save('m_popoli.png')
