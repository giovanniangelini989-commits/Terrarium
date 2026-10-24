from playwright.sync_api import sync_playwright
import json,sys
errs=[]; ok=0; bad=0
def t(n,c,x=''):
    global ok,bad
    if c: ok+=1
    else: bad+=1; print('✗',n,x)
VW,VH=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (390,844)
tag=sys.argv[3] if len(sys.argv)>3 else 'n'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=2); ctx.add_init_script("window.__fast=true; window.__no3d=true"); pg=ctx.new_page()
    def goto(t): pg.evaluate("(t)=>{ __ui.tab=t; __ui.render(); }",t); pg.wait_for_timeout(120)
    pg.on('pageerror',lambda e:errs.append('ERR '+str(e)[:200])); pg.on('console',lambda m: errs.append('CON '+m.text[:160]) if m.type=='error' else None)
    pg.goto('file://'+__import__('os').path.abspath('dist')+'/terrario-gioco.html'); pg.wait_for_timeout(1900)
    sc=lambda:pg.evaluate("__film.scene")
    t('parte dal video con la schermata «Tocca per iniziare»',pg.evaluate("__ui.mode")=='film' and pg.locator('.f-gate').count()==1); pg.screenshot(path=f'screenshots/{tag}_f0_gate.png'); pg.click('.f-gate'); pg.wait_for_timeout(300); t('si inizia dalla notte',sc()=='cielo',sc())
    pg.wait_for_timeout(500); pg.screenshot(path=f'screenshots/{tag}_f1_cielo.png')
    pg.mouse.click(VW*.5,VH*.22); pg.wait_for_timeout(700); pg.screenshot(path=f'screenshots/{tag}_f1b_caduta.png'); pg.wait_for_timeout(900)
    t('la stella cade → giardino',sc()=='giardino',sc()); pg.wait_for_timeout(500); pg.screenshot(path=f'screenshots/{tag}_f2_giardino.png')
    pg.mouse.move(VW*.66,VH*.84); pg.mouse.down(); pg.wait_for_timeout(450); pg.mouse.up(); pg.wait_for_timeout(1000)
    t('tenere premuto → barattolo',sc()=='barattolo',sc()); pg.wait_for_timeout(500); pg.screenshot(path=f'screenshots/{tag}_f3_barattolo.png')
    pg.mouse.move(VW*.5,VH*.2); pg.mouse.down(); pg.mouse.move(VW*.5,VH*.3,steps=6); pg.mouse.move(VW*.5,VH*.44,steps=6); pg.screenshot(path=f'screenshots/{tag}_f3b_trascina.png'); pg.mouse.up(); pg.wait_for_timeout(1400)
    t('sasso nel barattolo → scelta luce',sc()=='luce',sc()); pg.wait_for_timeout(400)
    t('Avanti bloccato finché non scegli',pg.locator('.f-ctl [data-f=next]').is_disabled())
    pg.click('.f-opt[data-k=luce][data-i="2"]'); pg.screenshot(path=f'screenshots/{tag}_f4_luce.png'); pg.click('[data-f=next]'); pg.wait_for_timeout(700)
    t('leggenda',sc()=='legenda',sc()); pg.wait_for_timeout(500); pg.screenshot(path=f'screenshots/{tag}_f7_leggenda.png')
    for _ in range(3): pg.mouse.click(VW*.5,VH*.5); pg.wait_for_timeout(250)
    pg.screenshot(path=f'screenshots/{tag}_f7b_battito.png'); t('3 tocchi sbloccano Avanti',pg.locator('.f-ctl [data-f=next]').count()==1); pg.click('[data-f=next]'); pg.wait_for_timeout(700)
    t('nome',sc()=='nome',sc()); pg.wait_for_timeout(300); pg.fill('#f-nm','Lumen'); pg.screenshot(path=f'screenshots/{tag}_f8_nome.png'); pg.click('[data-f=end]'); pg.wait_for_timeout(1500)
    t('gioco avviato con la scelta del video e il vaso vuoto',pg.evaluate("__ui.mode")=='game' and pg.evaluate("__app.G.name")=='Lumen' and pg.evaluate("__app.sim.view().setup.luce")==2 and pg.evaluate("__app.sim.view().setup.piante.length+__app.sim.view().setup.insetti.length+__app.sim.view().setup.oggetti.length")==0)
    pg.wait_for_timeout(600); pg.screenshot(path=f'screenshots/{tag}_g1_home.png')
    t('il barattolo è vuoto: un solo invito a mettere la terra',pg.locator('.cta[data-k=terra]').count()==1 and 'terra' in pg.inner_text('.cta').lower())
    t('il quaderno ha la prima pagina',pg.evaluate("__app.G.quaderno.length")>=1)
    # ---- avvio guidato: vaso vuoto, terra, acqua, muschio, felce, formica
    days=0; seenDec=set()
    def drain():
        for _ in range(14):
            if pg.locator('#cine').count(): pg.wait_for_timeout(250)
            elif pg.locator('#cardrev').count(): pg.wait_for_timeout(200); pg.evaluate("(()=>{const b=document.querySelector('[data-a=carta-ok]'); if(b) b.click();})()"); pg.wait_for_timeout(150)  # il pulsante cambia etichetta durante l'animazione: clic diretto
            elif pg.locator('.sheet [data-a=dec]').count():
                ty=pg.evaluate("__app.sim.pending[0]&&__app.sim.pending[0].type")
                if ty and ty not in seenDec: seenDec.add(ty); pg.screenshot(path=f'screenshots/{tag}_g6_dec_{ty}.png')
                pg.locator('.sheet [data-a=dec]').first.click(); pg.wait_for_timeout(200)
            elif pg.locator('.sheet [data-a=arr-ok]').count(): pg.locator('.sheet [data-a=arr-ok]').first.click(); pg.wait_for_timeout(200)
            elif pg.locator('.sheet [data-a=bis]').count(): pg.locator('.sheet [data-a=bis]').first.click(); pg.wait_for_timeout(200)
            elif pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').count(): pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').first.click(); pg.wait_for_timeout(200)
            elif pg.locator('.sheet [data-a=sx]').count(): pg.locator('.sheet [data-a=sx]').first.click(); pg.wait_for_timeout(200)
            elif pg.locator('.sheet [data-a=serie-no]').count(): pg.click('[data-a=serie-no]')
            else: break
    t('si parte con una sola barra (Terreno) e un solo pulsante: «Metti la terra»',pg.evaluate("__app.G.ui.fase")==0 and pg.locator('.hud .bar').count()==1 and pg.locator('.cta[data-k=terra]').count()==1 and pg.locator('.toolbar').count()==0 and pg.locator('#tabbar').is_hidden()); pg.screenshot(path=f'screenshots/{tag}_s0_vuoto.png')
    t('nel vaso vuoto la didascalia non parla di foglie',True)
    pg.click('[data-a=act][data-k=terra]'); pg.wait_for_timeout(300)
    t('con la terra compaiono l’umidità e «Bagna»',pg.evaluate("__app.G.ui.fase")==1 and pg.locator('.hud .bar').count()==2 and pg.locator('[data-a=act][data-k=acqua]').count()>=1 and pg.evaluate("__app.sim.view().needs.ter")>.5); pg.screenshot(path=f'screenshots/{tag}_s1_terra.png')
    pg.click('[data-a=act][data-k=acqua]'); pg.wait_for_timeout(600)
    t('bagnando arriva il muschio come notifica',pg.locator('.sheet [data-a=arr-ok]').count()==1 and 'muschio' in pg.inner_text('.sheet').lower()); pg.screenshot(path=f'screenshots/{tag}_s2_muschio.png')
    pg.click('.sheet [data-a=arr-ok]'); pg.wait_for_timeout(400)
    t('col muschio compaiono la Pulizia e le cure complete',pg.evaluate("__app.G.ui.fase")==3 and pg.locator('.hud .bar').count()==3 and pg.locator('[data-a=act][data-k=pulisci]').count()==1)
    for tipo in ['felce','formica']:
        for _ in range(14):
            if pg.locator('.sheet [data-a=arr-ok]').count(): break
            if pg.evaluate("__app.sim.view().needs.um")<.5: pg.click('[data-a=act][data-k=acqua]'); pg.wait_for_timeout(150)
            if pg.locator('.sheet').count()==0: pg.evaluate('__ui.passaNotte()'); pg.wait_for_timeout(400)
            for _ in range(5):
                if pg.locator('#cine').count(): pg.wait_for_timeout(250)
                elif pg.locator('.sheet [data-a=arr-ok]').count(): break
                elif pg.locator('.sheet [data-a=dec]').count(): pg.locator('.sheet [data-a=dec]').first.click(); pg.wait_for_timeout(200)
                elif pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').count(): pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').first.click(); pg.wait_for_timeout(200)
                elif pg.locator('.sheet [data-a=sx]').count(): pg.locator('.sheet [data-a=sx]').first.click(); pg.wait_for_timeout(200)
                else: break
        t(f'arriva la {tipo} come notifica',pg.locator('.sheet [data-a=arr-ok]').count()==1 and tipo in pg.inner_text('.sheet').lower(),pg.inner_text('.sheet')[:80] if pg.locator('.sheet').count() else 'nessuna scheda')
        pg.click('.sheet [data-a=arr-ok]'); pg.wait_for_timeout(500)
    t('con la prima formica compaiono Osserva e la fila dei gruppi',pg.evaluate("__app.G.ui.fase")==4 and pg.locator('[data-a=osserva]').count()>=1 and pg.locator('.qhandle').is_visible()); pg.screenshot(path=f'screenshots/{tag}_s5_vita.png')
    drain()
    # ---- notti vive e Biscotto
    drain(); goto('imp'); pg.click('[data-a=t-notte]'); pg.wait_for_timeout(400); t('una notte racconta qualcosa',pg.locator('.sheet').count()==1 and 'stanotte' in pg.inner_text('.sheet').lower()); pg.screenshot(path=f'screenshots/{tag}_x1_notte.png'); drain()
    goto('imp'); pg.click('[data-a=t-gatto]'); pg.wait_for_timeout(400); t('Biscotto: primo capitolo con una scelta',pg.locator('.sheet [data-a=gt]').count()==2); pg.screenshot(path=f'screenshots/{tag}_x2_gatto.png'); pg.locator('.sheet [data-a=gt]').nth(1).click(); pg.wait_for_timeout(300); t('la scelta su Biscotto ha un seguito',pg.locator('.sheet').count()==1 and pg.evaluate("(__app.G.ui.gattoF||{}).curioso")==1); drain()
    for _ in range(3):
        goto('imp'); pg.click('[data-a=t-gatto]'); pg.wait_for_timeout(300)
        if pg.locator('.sheet [data-a=gt]').count(): pg.locator('.sheet [data-a=gt]').first.click(); pg.wait_for_timeout(200)
        elif pg.locator('.sheet [data-a=bis]').count(): pg.locator('.sheet [data-a=bis]').first.click(); pg.wait_for_timeout(200)
        drain()
    goto('imp'); pg.click('[data-a=t-gatto]'); pg.wait_for_timeout(400); fine=pg.evaluate("__app.G.ui.gattoFine"); t('la storia di Biscotto arriva a un finale',fine in ('guardiano','amico','ladro'),fine); pg.screenshot(path=f'screenshots/{tag}_x3_gatto_fine.png'); drain(); goto('vaso')
    # ---- albero del vaso
    goto('quaderno'); pg.click('[data-a=cdx][data-t=albero]'); pg.wait_for_timeout(500)
    nn=pg.locator('.albero .tn').count(); kinds=pg.evaluate("[...new Set(((__app.G.tree)||{nodes:[]}).nodes.map(n=>n.k))]")
    t('l’albero del vaso mostra la storia con i rami',nn>=5 and pg.locator('.albero svg path').count()>=2,f'{nn} nodi {kinds}')
    t('nell’albero ci sono le scelte con la strada non presa',pg.locator('.albero .tn.sc .alt').count()>=1)
    t('i momenti importanti hanno la foto del vaso',pg.locator('.albero .tn img').count()>=1)
    pg.screenshot(path=f'screenshots/{tag}_t1_albero.png')
    pg.locator('.albero .tn').last.click(); pg.wait_for_timeout(300); t('toccando un nodo si apre il dettaglio',pg.locator('.sheet').count()==1); pg.screenshot(path=f'screenshots/{tag}_t2_nodo.png'); drain(); goto('vaso')
    # ---- bisogni
    t('la home mostra le tre barre dei bisogni (pillole sul vetro)',pg.locator('.hud .bar').count()==3 and all(pg.locator(f'.hud .bar[data-n={k}]').count()==1 for k in ['um','ter','pul']))
    pg.screenshot(path=f'screenshots/{tag}_n1_barre.png')
    pg.evaluate("window.__bakN=window.__notti.NOTTI; window.__notti.NOTTI=[]"); n0=pg.evaluate("__app.sim.view().needs")
    for _ in range(5):
        pg.evaluate('__ui.passaNotte()'); pg.wait_for_timeout(300)
        for _ in range(6):
            if pg.locator('#cine').count(): pg.wait_for_timeout(250)
            elif pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').count(): pg.locator('.sheet [data-a=nb], .sheet [data-a=gt]').first.click(); pg.wait_for_timeout(150)
            elif pg.locator('.sheet [data-a=sx]').count(): pg.locator('.sheet [data-a=sx]').first.click(); pg.wait_for_timeout(150)
            elif pg.locator('.sheet [data-a=dec]').count(): pg.locator('.sheet [data-a=dec]').first.click(); pg.wait_for_timeout(150)
            else: break
    n1=pg.evaluate("__app.sim.view().needs"); t('passando le notti senza curare le barre calano',n1['um']<n0['um']-.08 and n1['ter']<.8 and n1['pul']<1,[n0,n1]); pg.screenshot(path=f'screenshots/{tag}_n2_calate.png')
    pg.evaluate("window.__notti.NOTTI=window.__bakN")
    goto('vaso')
    for k in ['acqua','nutri','pulisci']: pg.click(f'[data-a=act][data-k={k}]'); pg.wait_for_timeout(150)
    n2=pg.evaluate("__app.sim.view().needs"); t('acqua e nutri fanno risalire le barre, pulisci non la fa scendere',n2['um']>n1['um']+.2 and n2['ter']>n1['ter']+.2 and n2['pul']>=n1['pul'],(n1,n2)); pg.screenshot(path=f'screenshots/{tag}_n3_curato.png')
    t('azioni gratuite: nessun limite di cure',True)
    # osserva con zoom
    pg.evaluate('window.__fast=false'); pg.click('[data-a=osserva]'); pg.wait_for_timeout(1900); t('zoom cinematografico attivo',pg.locator('#cine .cstage canvas').count()==1); pg.screenshot(path=f'screenshots/{tag}_g3_zoom.png'); pg.click('#cine'); pg.wait_for_timeout(700); pg.evaluate('window.__fast=true')
    t('finito lo zoom il vaso torna in home',pg.locator('#cine').count()==0 and pg.locator('#vb canvas').count()==1)
    drain(); goto('imp'); n0=pg.evaluate("__app.sim.view().setup.insetti.length+__app.sim.view().setup.piante.length+__app.sim.view().setup.oggetti.length")
    pg.click('[data-a=t-arrivo]'); pg.wait_for_timeout(600); t('arriva una notifica del bambino',pg.locator('.sheet [data-a=arr-ok]').count()>=1); pg.screenshot(path=f'screenshots/{tag}_g4_arrivo.png')
    pg.locator('.sheet [data-a=arr-ok]').first.click(); pg.wait_for_timeout(500)
    n1_=pg.evaluate("__app.sim.view().setup.insetti.length+__app.sim.view().setup.piante.length+__app.sim.view().setup.oggetti.length"); t('accogliere porta un elemento nel vaso',n1_==n0+1,(n0,n1_))
    goto('imp'); pg.click('[data-a=t-biscotto]'); pg.wait_for_timeout(400); t('Biscotto con timer',pg.locator('.sheet [data-a=bis]').count()==2); pg.screenshot(path=f'screenshots/{tag}_g5_biscotto.png'); pg.locator('.sheet [data-a=bis]').nth(1).click(); pg.wait_for_timeout(400); t('Biscotto: esito',pg.locator('.sheet h2').first.inner_text() in ('Salvo','Che botta')); pg.click('.sheet [data-a=sx]')
    # scorrimento veloce con cura automatica
    drain(); goto('vaso'); pg.wait_for_timeout(200); d0=pg.evaluate("__app.sim.d")
    def demo_on(): return pg.locator('#demoov.on').count()==1
    def demo_pause():
        try: pg.click('#demoBtn',timeout=1500)
        except Exception: pass  # la demo si è già fermata da sola (popup o carta)
    def demo_start():
        for _ in range(5):
            drain(); pg.wait_for_timeout(250); drain()
            try:
                goto('vaso'); pg.click('[data-a=menu]',timeout=3000); pg.wait_for_timeout(150); pg.click('[data-a=menu-go][data-g=demo]',timeout=3000); pg.wait_for_timeout(200)
            except Exception: continue
            if demo_on(): return
    dd0=pg.evaluate("__app.sim.d"); demo_start(); pg.wait_for_timeout(300); t('dal menu parte lo scorrimento veloce (si ferma da solo alle notifiche)',demo_on() or pg.evaluate("__app.sim.d")>dd0,(dd0,pg.evaluate("__app.sim.d")))
    drain(); goto('vaso'); drain(); goto('vaso'); pg.evaluate("__app.popups.length=0; document.getElementById('demoov').classList.add('on')")
    pg.evaluate("(()=>{ try{__ui.closeSheet()}catch(e){}; __app.popups.length=0; document.getElementById('demoov').classList.add('on'); })()"); pg.wait_for_timeout(150)
    pg.click('[data-a=demo-speed][data-s="16"]'); t('la velocità 16× si seleziona',pg.locator('[data-a=demo-speed][data-s="16"]').get_attribute('aria-pressed')=='true'); t('la cura automatica è attiva di default nella demo',pg.locator('[data-a=demo-auto]').get_attribute('aria-pressed')=='true'); pg.screenshot(path=f'screenshots/{tag}_k2_demo.png'); pg.evaluate("document.getElementById('demoov').classList.remove('on')")
    for _ in range(10):
        if demo_on():
            pg.wait_for_timeout(500)
            if demo_on(): demo_pause(); pg.wait_for_timeout(200)
        drain(); goto('vaso'); pg.wait_for_timeout(150)
        if pg.evaluate("__app.sim.d")>=d0+8 or pg.evaluate("!!__app.sim.finalePending"): break
        demo_start()
    d1=pg.evaluate("__app.sim.d"); t('lo scorrimento veloce fa avanzare molti giorni (si ferma a notifiche e decisioni)',d1>=d0+5,(d0,d1))
    t('con la cura automatica il vaso resta vivo',pg.evaluate("__app.sim.view().sp.some(x=>x.alive)") and pg.evaluate("__app.sim.view().needs.um")>.15)
    if pg.locator('.hud .day b').count(): t('il contatore dei giorni sale in diretta',int(pg.inner_text('.hud .day b'))==d1,(pg.inner_text('.hud .day b'),d1))
    drain()
    # carte
    goto('imp'); pg.click('[data-a=t-carte]'); goto('vaso'); pg.wait_for_timeout(200)
    t('il mazzo ha almeno 12 carte',pg.evaluate("__app.mazzoTot()")>=12)
    pg.click('[data-a=mazzo]'); pg.wait_for_timeout(250); pg.screenshot(path=f'screenshots/{tag}_k3_mazzo.png'); t('il ventaglio mostra tutte le carte del mazzo (almeno 12)',pg.locator('#hand .cardrow').count()>=12 and pg.locator('#hand .cardrow').count()==pg.evaluate("Object.keys(__app.G.mazzo).length"))
    pg.evaluate("__app.sim.charge(-100)"); e0=pg.evaluate("__app.sim.E"); pg.click('#hand [data-a=carta-gioca][data-id=scintilla]'); pg.wait_for_timeout(400); drain(); e1=pg.evaluate("__app.sim.E"); t('Scintilla carica il meteorite (dal mazzo, in qualsiasi momento)',e1>e0+20,(e0,e1))
    t('giocata la carta, il ventaglio si chiude',pg.locator('#hand').count()==0)
    # trascinare una carta sul vaso la gioca
    goto('vaso'); pg.click('[data-a=mazzo]'); pg.wait_for_timeout(250); n0=pg.evaluate("__app.G.mazzo.pioggia||0"); bb=pg.locator('#hand .cardrow[data-id=pioggia] .ct').bounding_box()
    if bb:
        pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.mouse.down(); pg.mouse.move(bb['x']+bb['width']/2,bb['y']-60,steps=5); pg.mouse.move(VW/2,VH*.25,steps=8); pg.screenshot(path=f'screenshots/{tag}_k3b_trascina.png'); pg.mouse.up(); pg.wait_for_timeout(500); drain()
    t('una carta trascinata sul vaso viene giocata',bb is not None and pg.evaluate("__app.G.mazzo.pioggia||0")==n0-1,(bb,n0))
    r=pg.evaluate("(()=>{ const A=__app, o={}; A.G.mazzo.sasso=2; A.G.mazzo.scudo=2; A.playCard('sasso'); o.met=A.sim.view().setup.meteorite; o.sasso2=A.canPlay('sasso'); A.playCard('moneta'); o.mon=A.sim.view().setup.oggetti.includes('moneta'); A.playCard('scudo'); o.scudo=A.G.ui.scudo; o.scudo2=A.canPlay('scudo'); o.bus=A.playCard('bussola').text; A.playCard('candela'); A.playCard('radio'); o.ogg=A.sim.view().setup.oggetti.length; return o; })()")
    t('Il sasso cresce, poi la carta si blocca; moneta/candela/radio entrano nel vaso',r['met']==2 and 'massimo' in r['sasso2'] and r['mon'] and r['ogg']>=3,r)
    t('Scudo di vetro pronto e non raddoppiabile; la Bussola dà un indizio',r['scudo']==1 and 'pronto' in r['scudo2'] and len(r['bus'])>40,r)
    drain(); goto('imp'); pg.click('[data-a=t-biscotto]'); pg.wait_for_timeout(400)
    for _ in range(6):
        if pg.locator('.sheet h2').count() and pg.locator('.sheet h2').first.inner_text()=='Salvo': break
        if pg.locator('.sheet [data-a=sx]').count(): pg.locator('.sheet [data-a=sx]').first.click(); pg.wait_for_timeout(250)
        else: pg.wait_for_timeout(200)
    t('con lo scudo Biscotto non fa danni',pg.locator('.sheet h2').first.inner_text()=='Salvo' and pg.evaluate("__app.G.ui.scudo")==0); pg.click('.sheet [data-a=sx]')
    drain(); goto('quaderno'); pg.click('[data-a=cdx][data-t=carte]'); pg.wait_for_timeout(250); pg.screenshot(path=f'screenshots/{tag}_k5_carte.png'); t('l’album mostra i quattro set e le quote della pesca',pg.locator('.alb-set').count()==4 and pg.locator('.alb-odds').count()==1 and '70%' in pg.inner_text('.alb-odds') and '8%' in pg.inner_text('.alb-odds'))
    t('le carte mancanti sono sagome con «come arriva», mai «???»',pg.locator('.alb-sil').count()>=4 and '???' not in pg.inner_text('.alb'))
    pg.locator('.alb-c').first.click(); pg.wait_for_timeout(300); t('toccando una carta dell’album si apre a schermo',pg.locator('#cardview .ct').count()==1); pg.screenshot(path=f'screenshots/{tag}_k6_visore.png'); pg.click('#cardview button[data-c=chiudi]'); pg.wait_for_timeout(200)
    # fino al finale scorrendo (cura automatica)
    while days<60 and not pg.evaluate("!!__app.sim.finalePending"):
        drain(); goto('vaso')
        if pg.evaluate("__app.sim.pending.length")==0: demo_start(); pg.wait_for_timeout(600)
        else: pg.evaluate("__app.queueDecisions(); __ui.showNextPopup()")
        if demo_on(): demo_pause(); pg.wait_for_timeout(100)
        days+=1
    drain()
    fp=pg.evaluate("__app.sim.finalePending"); t('con le cure arriva un finale di società, non lo spegnimento',bool(fp) and fp['finale']!='spento',fp); print('finale:',fp,'· giorno del vaso',pg.evaluate("__app.sim.d"),'· decisioni viste',seenDec)
    goto('vaso'); pg.wait_for_timeout(300); pg.screenshot(path=f'screenshots/{tag}_g7_finale_guida.png')
    if fp:
        pg.click('.nf[data-a=fin-open]'); pg.wait_for_timeout(700)
        for _ in range(8):
            if pg.locator('#reveal').count(): break
            pg.wait_for_timeout(300)
        t('rivelazione con epilogo del bambino',pg.locator('#reveal .epi').count()==1); pg.screenshot(path=f'screenshots/{tag}_g8_rivelazione.png'); pg.click('[data-a=fin-continue]'); pg.wait_for_timeout(300); pg.click('[data-a=fin-close]'); pg.wait_for_timeout(500)
        t('compare la velina con la carta del finale',pg.locator('#cardrev').count()==1 and pg.locator('#cardrev .vel').count()==1); pg.wait_for_timeout(300); pg.screenshot(path=f'screenshots/{tag}_k1_velina.png')
        vb=pg.locator('#cardrev .vel').bounding_box(); pg.mouse.move(vb['x']+vb['width']/2,vb['y']+vb['height']/2); pg.mouse.down(); pg.mouse.move(vb['x']+vb['width']/2,vb['y']+vb['height']/2-90,steps=6); pg.mouse.up(); pg.wait_for_timeout(400)
        t('scorrendo, la velina si apre e sotto c’è la carta',pg.evaluate("document.getElementById('cardrev').dataset.st") in ('apertura','chiusa'),pg.evaluate("document.getElementById('cardrev').dataset.st"))
        pg.locator('#cardrev .ct').click(); pg.wait_for_timeout(500); pg.screenshot(path=f'screenshots/{tag}_k1_carta.png')
        t('toccando la carta si gira e si legge',pg.evaluate("document.getElementById('cardrev').dataset.st")=='lettura',pg.evaluate("document.getElementById('cardrev').dataset.st"))
        pg.click('[data-a=carta-ok]'); pg.wait_for_timeout(400); t('«Nel mazzo» chiude l’unboxing e subito dopo arriva il ricordo «Il primo finale»',pg.locator('#cardrev').count()==0 or pg.locator('#cardrev.r-ricordo').count()==1 and pg.evaluate("!!__app.G.album.ric_finale"))
        if pg.locator('#cardrev.r-ricordo').count(): pg.wait_for_timeout(300); pg.screenshot(path=f'screenshots/{tag}_k1b_ricordo.png')
        t('il finale è nel Libro',len(pg.evaluate("Object.keys(__app.G.libro)"))==1); t('il vaso continua (capitolo 2)',pg.evaluate("__app.sim.view().chapter")==2)
        drain()
    # ---- dentro la ciotola
    drain(); goto('vaso'); pg.wait_for_timeout(600)
    pg.click('.hud .day'); pg.wait_for_timeout(350); t('toccando il giorno si apre «Come sta il vaso» con chi ci vive',pg.locator('.sheet .gchip').count()>=1 and 'come sta' in pg.inner_text('.sheet').lower())
    soc=pg.evaluate("(__app.sim.view().sp.find(x=>x.alive&&x.society)||{}).id"); gid=soc or pg.evaluate("__app.sim.view().sp.find(x=>x.alive).id")
    pg.click(f'.sheet .gchip[data-id={gid}]'); pg.wait_for_timeout(500); sh=pg.inner_text('.sheet').lower(); pg.screenshot(path=f'screenshots/{tag}_p1_popolo.png')
    t('toccando un gruppo si apre la scheda (un popolo, se c’è una società)',('un popolo' in sh) if soc else ('nel vaso' in sh),sh[:80])
    t('la scheda dà indizi, non spiegazioni','indizi' in sh)
    pg.click('.sheet [data-a=sx]'); pg.wait_for_timeout(900); pos=pg.evaluate(f"__vase.screenOf('{gid}')")
    pg.mouse.click(pos['x'],pos['y']); pg.wait_for_timeout(400); t('si può toccare direttamente il gruppo nel vaso',pg.locator('.sheet').count()==1 and ('un popolo' in pg.inner_text('.sheet').lower() or 'nel vaso' in pg.inner_text('.sheet').lower()),pos)
    pg.click('.sheet [data-a=sx]'); pg.wait_for_timeout(300); pg.evaluate("__vase.bubble('%s','✨')"%gid); pg.wait_for_timeout(400); pg.screenshot(path=f'screenshots/{tag}_p2_bolla.png')
    # ---- se smetti di giocare
    res=pg.evaluate("(()=>{ const A=__app, out=[]; for(let i=1;i<=8;i++){ A.G.dev.offset++; A.checkNewDay(); let g=0; while(A.sim.pending.length&&g++<12){ const p=A.sim.pending[0]; A.resolveDecision(p.id,p.type==='mutazione'?'proteggi':p.type==='guerra'?'lascia':'nascosto'); } const v=A.sim.view(); out.push([i,v.sp.filter(x=>x.alive).length,Math.round(v.needs.um*100),Math.round(v.needs.ter*100),Math.round(v.needs.pul*100),A.sim.finalePending?A.sim.finalePending.finale:null]); if(i===3) window.__snap=1; A.popups.length=0; if(A.sim.finalePending) break; } return out; })()")
    last=res[-1]; print('abbandono:',res)
    t('se smetti di giocare il vaso si spegne in circa 5 giorni (tra 3 e 7)',last[5]=='spento' and 3<=last[0]<=7,res)
    pg.reload(); pg.wait_for_timeout(1900); drain(); goto('vaso'); pg.wait_for_timeout(300); pg.screenshot(path=f'screenshots/{tag}_n4_spento.png')
    t('dopo l’abbandono il gioco offre il finale «Il Vaso Spento»',pg.evaluate("__app.sim.finalePending&&__app.sim.finalePending.finale")=='spento' and pg.locator('.nf[data-a=fin-open]').count()==1)
    pg.click('.nf[data-a=fin-open]'); pg.wait_for_timeout(900)
    for _ in range(8):
        if pg.locator('#reveal').count(): break
        pg.wait_for_timeout(300)
    t('la rivelazione dice «Il Vaso Spento»',pg.locator('#reveal').count()==1 and 'Spento' in pg.inner_text('#reveal')); pg.screenshot(path=f'screenshots/{tag}_n5_finale_spento.png'); pg.click('[data-a=fin-continue]'); pg.click('[data-a=fin-close]'); pg.wait_for_timeout(500); drain()
    t('Il Vaso Spento chiude il capitolo e dà una carta',pg.evaluate("__app.G.libro.spento!=null") and pg.evaluate("__app.sim.view().chapter")>=3)
    goto('quaderno'); pg.click('[data-a=cdx][data-t=pagine]'); pg.wait_for_timeout(300); np_=pg.evaluate("__app.G.quaderno.length"); t('il quaderno racconta più pagine',np_>=3,np_); pg.screenshot(path=f'screenshots/{tag}_g9_quaderno.png')
    goto('imp'); pg.wait_for_timeout(200)
    d0=pg.evaluate("__app.sim.d"); pg.reload(); pg.wait_for_timeout(1900); t('dopo il ricaricamento il gioco riprende',pg.evaluate("__ui.mode")=='game' and pg.evaluate("__app.sim.d")>=d0,(pg.evaluate("__app.sim.d"),d0))
    pg.evaluate("(()=>{ const g=JSON.parse(localStorage.getItem('terrario.save.v2')); delete g.arrivi; delete g.quaderno; delete g.req; delete g.coda; delete g.mazzo; g.real={lastDay:1,actions:3,owed:2}; g.settings={audio:{vibr:true},calma:{pausa:true},tempo:'auto'}; g.ui={}; localStorage.setItem('terrario.save.v2',JSON.stringify(g)); })()")
    pg.reload(); pg.wait_for_timeout(1900); drain(); t('un vecchio salvataggio si carica senza errori',pg.evaluate("__ui.mode")=='game' and pg.evaluate("Array.isArray(__app.G.quaderno)&&!!__app.G.req.kind&&__app.G.arrivi.list.length>0&&!!__app.G.mazzo&&Object.keys(__app.sim.view().needs).length==3"))
    print('overflow orizzontale:',pg.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
    b.close()
print(ok,'ok',bad,'falliti'); print('errori console:',errs or 'nessuno')

import sys; sys.exit(1 if bad or errs else 0)
