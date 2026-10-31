"""Nessuna emoji visibile: apre scenari (?test), schede e pagine del quaderno e cerca emoji nel DOM (testo e attributi)."""
from playwright.sync_api import sync_playwright
import os,sys
VW,VH=390,844
URL='file://'+os.path.abspath('dist')+'/terrario-gioco.html'
SCAN="""()=>{ const re=/(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})/u, ok=m=>{const c=m.codePointAt(0);return (c>=0x2190&&c<=0x21FF)||c===0xA9||c===0xAE||c===0x2122;}; const out=[];
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ const m=n.nodeValue.match(new RegExp(re.source,'gu')); if(m&&m.some(x=>!ok(x))&&!/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) out.push(n.nodeValue.slice(0,60)); }
 document.querySelectorAll('*').forEach(e=>{ for(const a of ['title','aria-label','alt','placeholder','value']){ const v=e.getAttribute(a); if(v&&[...v.matchAll(new RegExp(re.source,'gu'))].some(x=>!ok(x[0]))) out.push('@'+a+':'+v.slice(0,40)); } });
 return out; }"""
bad={}
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=2); ctx.add_init_script("window.__fast=true; window.__no3d=true"); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200])); pg.on('dialog',lambda d:d.accept())
    pg.goto(URL+'?test'); pg.wait_for_timeout(1900)
    def scan(tag):
        r=pg.evaluate(SCAN)
        if r: bad[tag]=r[:4]
    def pan():
        if pg.locator('#tst-pan').count()==0: pg.evaluate("document.getElementById('tst-btn').click()"); pg.wait_for_timeout(80)
    pan(); ids=pg.evaluate("[...document.querySelectorAll('#tst-pan .it')].map(b=>[b.dataset.sc,b.disabled])")
    scan('pannello')
    pg.evaluate("document.querySelector('#tst-pan [data-sc=\"avviato\"]').click()"); pg.wait_for_timeout(900)
    for sid in [i for i,d in ids if i and not d and i not in('video','esporta','importa','azzera','tutto','avviato')]:
        pg.evaluate("(()=>{ try{__ui.closeSheet()}catch(e){}; ['cine','cardrev','reveal','hand','cardview'].forEach(i=>{const e=document.getElementById(i); if(e) e.remove();}); })()")
        pan(); pg.evaluate("(id)=>document.querySelector('#tst-pan [data-sc=\"'+id+'\"]').click()",sid); pg.wait_for_timeout(1100)
        scan('sc:'+sid)
        for tab in ['vaso','quaderno','mondo','impostazioni']:
            pass
    for cdx in ['oggi','atlante','albero','pagine','cronaca','finali','carte']:
        pg.evaluate("(c)=>{ document.querySelectorAll('.scrim[data-a=sx]').forEach(b=>b.click()); __ui.tab='quaderno'; __ui.render(); const x=document.querySelector('[data-a=cdx][data-t=\"'+c+'\"]'); if(x) x.click(); }",cdx); pg.wait_for_timeout(300); scan('quaderno:'+cdx)
    print('errori JS:',errs[:3])
    print('schermate con emoji:',len(bad))
    for k,v in bad.items(): print(' ',k,v)
    sys.exit(1 if bad else 0)
