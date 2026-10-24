"""Tocca ogni scenario disponibile della modalità test (?test) e controlla zero errori in console."""
from playwright.sync_api import sync_playwright
import os,sys
errs=[]; ok=0; bad=0
def t(n,c,x=''):
    global ok,bad
    if c: ok+=1
    else: bad+=1; print('✗',n,x)
VW,VH=390,844
URL='file://'+os.path.abspath('dist')+'/terrario-gioco.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=2,permissions=['clipboard-read','clipboard-write'])
    ctx.add_init_script("window.__fast=true; window.__no3d=true")
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:200]))
    pg.on('console',lambda m: errs.append('CON '+m.text[:160]) if m.type=='error' else None)
    pg.on('dialog',lambda d: d.accept())
    # senza ?test non esiste nulla
    pg.goto(URL); pg.wait_for_timeout(1500)
    t('senza ?test nessun pulsante',pg.locator('#tst-btn').count()==0 and pg.evaluate("typeof window.__scenari")=='undefined')
    pg.goto(URL+'?test'); pg.wait_for_timeout(1900)
    t('con ?test compare il pulsante',pg.locator('#tst-btn').count()==1)
    pg.click('#tst-btn'); pg.wait_for_timeout(300)
    t('il pannello si apre',pg.locator('#tst-pan').count()==1)
    pg.screenshot(path='screenshots/test/pannello.png')
    ids=pg.evaluate("[...document.querySelectorAll('#tst-pan .it')].map(b=>[b.dataset.sc,b.disabled])")
    t('ci sono molti scenari',len(ids)>=40,len(ids))
    grigie=[i for i,d in ids if d]; print('grigie (in attesa):',grigie)
    ordine=[i for i,d in ids if not d and i not in('video','esporta','importa','azzera')]+['esporta','importa','azzera','video']
    def pulisci():
        pg.evaluate("(()=>{ try{__ui.closeSheet()}catch(e){}; ['cine','cardrev','reveal'].forEach(i=>{const e=document.getElementById(i); if(e) e.remove();}); __app.popups.length=0; })()")
    for sid in ordine:
        pulisci()
        if pg.locator('#tst-pan').count()==0:
            pg.evaluate("document.getElementById('tst-btn').click()"); pg.wait_for_timeout(60)
        n0=len(errs)
        pg.evaluate("(id)=>document.querySelector('#tst-pan [data-sc=\"'+id+'\"]').click()",sid)
        pg.wait_for_timeout(1400 if sid in('esporta','importa','azzera','video') else 700)
        if sid in('importa','azzera'):
            pg.wait_for_load_state('load'); pg.wait_for_function("window.__app && document.readyState==='complete'",timeout=15000); pg.wait_for_timeout(600)
        t(sid+': chiude il pannello',pg.locator('#tst-pan').count()==0)
        if sid not in('esporta','azzera','video','importa'):
            tx=pg.evaluate("(document.getElementById('toast')||{}).textContent||''")
            t(sid+': toast «Scenario»',tx.startswith('Scenario') or sid=='fps',tx)
        t(sid+': zero errori',len(errs)==n0,errs[n0:])
        if sid=='popolo':
            pg.wait_for_timeout(500); pg.screenshot(path='screenshots/test/scenario_popolo.png')
        if sid=='importa':
            pg.wait_for_load_state('load'); pg.wait_for_function("window.__app && !!__app.G",timeout=15000)
            t('importa ricarica con una partita',pg.evaluate("!!__app.G"))
        if sid=='azzera':
            t('azzera: nessun salvataggio',pg.evaluate("__app.store.get()")is None or pg.evaluate("__ui.mode")=='film')
    t('console senza errori',not errs,errs[:5])
    b.close()
print('ok',ok,'ko',bad)
sys.exit(1 if bad or errs else 0)
