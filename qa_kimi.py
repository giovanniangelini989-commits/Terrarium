from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1); ctx.add_init_script("window.__fast=true"); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200])); pg.on('console',lambda m:errs.append(m.text[:200]) if m.type in('error','warning') and 'Audio' not in m.text else None)
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche','coleotteri','lumache'],oggetti:['statuina','orologio','giocattolo']}); __app.G.settings.tempo='giorno'; __ui.mode='game'; __app.popups.length=0; __ui.render()"); pg.wait_for_timeout(300)
    print('3D:',pg.evaluate("__vase.set3d(true)")); pg.evaluate("__ui.render()"); pg.wait_for_timeout(4000); pg.screenshot(path='screenshots/k_1.png')
    pg.evaluate("""()=>{ const A=__app; A.__o=A.sim.view.bind(A.sim); A.sim.view=()=>{ const v=A.__o(); v.d=100; v.sp=v.sp.map((x,k)=>k===0?Object.assign({},x,{pop:70,society:{name:'P',cult:'sacro',since:30,culto:'giocatore'}}):x); return v; }; }"""); pg.wait_for_timeout(4000); pg.screenshot(path='screenshots/k_2.png')
    pg.evaluate("__vase.zoomTo({kind:'specie',id:'formiche'})"); pg.wait_for_timeout(3500); pg.screenshot(path='screenshots/k_3.png')
    print(errs[:5] or 'nessun errore'); b.close()
