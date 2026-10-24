from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1); pg=ctx.new_page()
    pg.close()
    ctx2=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1); ctx2.add_init_script("window.__fast=true"); pg=ctx2.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('film')&&document.getElementById('film').remove(); __app.newGame('T',{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche','coleotteri','lumache'],oggetti:['statuina','orologio','giocattolo']}); __app.G.settings.tempo='giorno'; __ui.mode='game'; __app.popups.length=0; __ui.render()"); pg.wait_for_timeout(300)
    pg.evaluate("__vase.set3d(true)"); pg.evaluate("__ui.render()"); pg.wait_for_timeout(7000); pg.screenshot(path='screenshots/c_oggi.png')
    pg.evaluate("__vase.zoomTo({kind:'meteorite'})"); pg.wait_for_timeout(4500); pg.screenshot(path='screenshots/c_oggi_zoom.png')
    print(errs or 'nessun errore'); b.close()
