#!/usr/bin/env python3
"""Giocatore simulato di Terrario.

Uso: python3 tools/giocatore.py <curioso|frettoloso|distratto|ostinato> [giorni]

Apre dist/terrario-gioco.html (390x844) e gioca toccando solo quello che si vede.
Le uniche scorciatoie interne servono a far passare il tempo reale
(G.dev.offset + checkNewDay, come fanno e2e.py e i bot): le scelte sono sempre tocchi.
Scrive il diario grezzo in docs/giocatore/<data>-<persona>.log.json e le schermate
segnalate in screenshots/giocatore/<data>-<persona>-NN-<motivo>.png.
Nota: questa macchina non raggiunge jsDelivr, quindi si gioca con window.__no3d=true (vaso 2D).
"""
from playwright.sync_api import sync_playwright
import sys, os, json, re, hashlib, random, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.environ.get('GIOCATORE_DATA', '2026-10-24')
VW, VH = 390, 844
MAX_SHOTS = 5
PERSONE = ('curioso', 'frettoloso', 'distratto', 'ostinato')


def norm(s):
    return re.sub(r'\d+', '#', s.strip())


class Giocatore:
    def __init__(self, pg, persona):
        self.pg = pg
        self.persona = persona
        self.clock = 0.0           # secondi di gioco "vissuti" (tempo di una persona, non del computer)
        self.next_tick = 10.0
        self.rows = []             # righe ogni 10 s
        self.acts = []             # azioni dall'ultimo tick
        self.newstuff = []         # novità dall'ultimo tick
        self.seen_text = set()
        self.seen_panels = set()
        self.seen_creat = set()
        self.last_resp = 0.0       # clock dell'ultima risposta visibile
        self.last_novel = 0.0      # clock dell'ultima novità
        self.shots = []
        self.flags = []            # noia / confusione / frustrazione / bello
        self.same = {}             # azione -> n di ripetizioni senza effetto
        self.timeline = []         # (clock, giorno, testo)
        self.rnd = random.Random({'curioso': 1, 'frettoloso': 2, 'distratto': 3, 'ostinato': 4}[persona])
        self.last_sig = None
        self.noia_flagged_at = -999

    # ---------- osservazione ----------
    def day(self):
        try:
            return self.pg.evaluate("window.__app&&__app.sim?__app.sim.d:0")
        except Exception:
            return 0

    def screen_text(self):
        return self.pg.evaluate("document.body.innerText")

    def sig(self):
        return self.pg.evaluate("""()=>{ const bars=[...document.querySelectorAll('.hud .bar')].map(b=>b.getAttribute('style')||b.innerText).join('|');
          const pan=['.sheet','#cine','#cardrev','#reveal','.nf','.toast','#demoov.on'].map(s=>document.querySelectorAll(s).length).join(',');
          const st=[...document.querySelectorAll('[data-a],[data-f],.f-opt')].filter(e=>e.getClientRects().length).map(e=>e.className+(e.getAttribute('aria-pressed')||'')+(e.getAttribute('aria-selected')||'')+(e.disabled?'d':'')).join('|');
          return document.body.innerText+'##'+bars+'##'+pan+'##'+(window.__ui?__ui.tab+__ui.mode:'')+'##'+st; }""")

    def panels(self):
        return self.pg.evaluate("""()=>{ const o=[]; if(document.querySelector('.sheet')) o.push('scheda:'+(document.querySelector('.sheet h2,.sheet h3,.sheet b')||{innerText:''}).innerText.trim().slice(0,40));
          if(document.querySelector('#cine')) o.push('zoom'); if(document.querySelector('#cardrev')) o.push('carta'); if(document.querySelector('#reveal')) o.push('rivelazione');
          document.querySelectorAll('.nf').forEach(n=>o.push('notifica:'+(n.getAttribute('aria-label')||'').slice(0,40)));
          if(window.__ui&&__ui.tab&&__ui.tab!=='vaso') o.push('tab:'+__ui.tab); return o; }""")

    def creatures(self):
        try:
            return self.pg.evaluate("__app.sim.view().sp.filter(x=>x.alive).map(x=>x.nome||x.id)")
        except Exception:
            return []

    def invites(self):
        return self.pg.evaluate("""()=>{ const o=[]; const vis=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
          document.querySelectorAll('.cta,.nf,.toast,.f-hint,.req,[data-a=req-go]').forEach(e=>{ if(vis(e)){ const t=(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,70); if(t) o.push(t); } }); return o; }""")

    def look(self, why=''):
        """Guarda lo schermo: registra le novità. Ritorna la lista delle novità."""
        nov = []
        for ln in self.screen_text().split('\n'):
            ln = ln.strip()
            if len(ln) < 4:
                continue
            k = norm(ln)
            if k not in self.seen_text:
                self.seen_text.add(k)
                nov.append('testo: ' + ln[:90])
        for p in self.panels():
            k = p.split(':')[0] + ':' + norm(p.split(':', 1)[1]) if ':' in p else p
            if k not in self.seen_panels:
                self.seen_panels.add(k)
                nov.append('pannello: ' + p)
        for c in self.creatures():
            if c not in self.seen_creat:
                self.seen_creat.add(c)
                nov.append('creatura: ' + str(c))
        if nov:
            self.last_novel = self.clock
            self.newstuff += nov
        return nov

    # ---------- tempo ----------
    def advance(self, secs, real_ms=0):
        """Passa tempo vissuto (secs) e, se serve, tempo reale breve per le animazioni."""
        if real_ms:
            self.pg.wait_for_timeout(real_ms)
        end = self.clock + secs
        while self.clock + 1e-9 < end:
            step = min(end, self.next_tick) - self.clock
            self.clock += step
            if self.clock + 1e-9 >= self.next_tick:
                self.tick()

    def tick(self):
        self.look()
        inv = self.invites()
        row = dict(t=int(self.next_tick), giorno=self.day(), novita=self.newstuff[:8], n_novita=len(self.newstuff),
                   azioni=self.acts[:10], da_ultima_risposta_s=round(self.clock - self.last_resp, 1),
                   da_ultima_novita_s=round(self.clock - self.last_novel, 1), inviti=inv[:4])
        self.rows.append(row)
        # regole di noia
        if self.clock - self.last_novel > 60 and self.clock - self.noia_flagged_at > 60:
            self.noia_flagged_at = self.clock
            self.flag('noia', f'più di 60 s senza una novità (invito visibile: {inv[:2] or "nessuno"})', shot=True)
        if not inv and self.clock - self.last_novel > 30:
            self.flag('confusione', 'nessun invito chiaro su cosa fare', shot=False)
        self.acts = []
        self.newstuff = []
        self.next_tick += 10.0

    def flag(self, kind, text, shot=False, tag=None):
        entry = dict(t=int(self.clock), giorno=self.day(), tipo=kind, testo=text, schermata=None)
        quota = {'noia': 1, 'confusione': 1, 'frustrazione': 2, 'bello': 2}.get(kind, 1)
        if shot and len(self.shots) < MAX_SHOTS and sum(1 for f in self.flags if f['tipo'] == kind and f['schermata']) < quota:
            n = len(self.shots) + 1
            rel = f'screenshots/giocatore/{DATA}-{self.persona}-{n:02d}-{kind}{"-" + tag if tag else ""}.png'
            self.pg.screenshot(path=os.path.join(ROOT, rel))
            self.shots.append(rel)
            entry['schermata'] = rel
        self.flags.append(entry)

    def note(self, text):
        self.timeline.append((int(self.clock), self.day(), text))
        if os.environ.get('GIOC_DEBUG'):
            print('  ·', int(self.clock), 'g' + str(self.day()), text[:150], flush=True)

    # ---------- azioni ----------
    def responded(self, before, ms=1200):
        """La pagina ha risposto in modo visibile entro ms?"""
        waited = 0
        while waited <= ms:
            if self.sig() != before:
                self.last_resp = self.clock
                return True
            self.pg.wait_for_timeout(100)
            waited += 100
        return False

    def tap(self, selector, label, think=2.0, nth=0, timeout=1500):
        """Tocca un elemento visibile. Ritorna True se c'è stata una risposta visibile."""
        loc = self.pg.locator(selector)
        if loc.count() <= nth:
            return None
        before = self.sig()
        err = None
        for tentativo in range(2):          # una persona riprova se lo schermo si stava animando
            try:
                loc = self.pg.locator(selector)
                if loc.count() <= nth:
                    return None
                loc.nth(nth).click(timeout=timeout)
                err = None
                break
            except Exception as e:
                err = e
                self.pg.wait_for_timeout(700)
        if err is not None:
            # Playwright rifiuta i pulsanti che si animano; una persona li toccherebbe lo stesso.
            # Provo il tocco a coordinate: se in quel punto c'è davvero il pulsante, funziona.
            try:
                pt = self.pg.evaluate("""([sel,n])=>{ const e=[...document.querySelectorAll(sel)][n]; if(!e) return null; const r=e.getBoundingClientRect(); const x=r.x+r.width/2, y=r.y+r.height/2; const t=document.elementFromPoint(x,y); return {x,y,ok:!!t&&(e.contains(t)||t.contains(e)), blocco:t?(t.tagName+'.'+(t.className||'')):''}; }""", [selector, nth])
            except Exception:
                pt = None
            if pt and pt['ok']:
                self.pg.mouse.click(pt['x'], pt['y'])
                self.acts.append(f'{label} (tocco a mano: il pulsante si animava)')
                self.artefatti = getattr(self, 'artefatti', 0) + 1
                ok = self.responded(before)
                self.advance(think)
                self.look()
                return ok
            causa = re.search(r'<[^>]{0,80}>.*?intercepts', str(err).replace('\n', ' '))
            self.acts.append(f'{label} (NON toccabile)')
            self.flag('frustrazione', f'non riesco a toccare «{label}»' + (f' (qualcosa ci sta sopra: {causa.group(0)[:90]})' if causa else (f' (sopra c\'è: {pt["blocco"][:60]})' if pt else '')), shot=True)
            self.advance(think)
            return False
        self.acts.append(label)
        ok = self.responded(before)
        self.advance(think)
        nov = self.look()
        key = label
        if ok:
            self.same[key] = 0
        else:
            self.same[key] = self.same.get(key, 0) + 1
            if self.same[key] >= 3:
                self.flag('noia', f'3 volte «{label}» senza effetto visibile', shot=True, tag='ripetuta')
                self.same[key] = 0
            elif self.same[key] == 1:
                self.flag('frustrazione', f'«{label}»: nessuna risposta visibile', shot=False)
        return ok

    def tap_xy(self, x, y, label, think=2.0):
        before = self.sig()
        self.pg.mouse.click(x, y)
        self.acts.append(label)
        ok = self.responded(before, 800)
        self.advance(think)
        self.look()
        return ok

    def sheet_text(self):
        return self.pg.evaluate("(document.querySelector('.sheet')||{innerText:''}).innerText").replace('\n', ' · ')

    def read(self, text):
        """Tempo di lettura di una persona: ~ 0.045 s a carattere, con un minimo."""
        mult = {'curioso': 1.0, 'frettoloso': 0.35, 'distratto': 0.7, 'ostinato': 0.8}[self.persona]
        self.advance(max(1.5, len(text) * 0.045 * mult))


# ---------------- il video iniziale ----------------

def gioca_video(g, nome):
    pg = g.pg
    sc = lambda: pg.evaluate("__film.scene")
    hint = lambda: pg.evaluate("(document.querySelector('.f-hint')||{}).textContent||''")
    g.look()
    g.read('Terrario Tocca per iniziare Meglio con l’audio acceso')
    g.tap('.f-gate', 'tocco «Tocca per iniziare»', think=1.0)
    lh, ls, stuck, taps_lost = '', '', 0, 0
    skip_ok = g.persona == 'frettoloso'
    for i in range(160):
        if pg.evaluate("__ui.mode") != 'film':
            break
        s = sc()
        h = hint()
        if s != ls:
            lh, ls, stuck = '', s, 0
            g.note(f'video: scena «{s}»')
        if h:
            lh = h
        g.look()
        stuck += 1
        if os.environ.get('GIOC_DEBUG'): print('film', i, s, repr(h or lh), stuck, flush=True)
        if skip_ok and s in ('cielo', 'giardino', 'barattolo') and g.persona == 'frettoloso' and stuck == 2:
            if g.tap('.f-skip', 'tocco «Salta ›»', think=0.8):
                g.note('ho saltato il video con «Salta ›»')
            continue
        hh = h or lh
        if pg.locator('.f-ctl [data-f]').count():
            hh = ''
        if 'stella' in hh:
            if g.tap_xy(195, 186, 'tocco la stella', 1.2) is False and stuck > 3:
                pass
        elif 'premuto' in hh:
            hold = 0.45 if (g.persona == 'frettoloso' and stuck < 3) else 1.2  # il frettoloso molla presto
            before = g.sig()
            pg.mouse.move(VW * .66, VH * .84); pg.mouse.down(); pg.wait_for_timeout(int(hold * 1000)); pg.mouse.up()
            g.acts.append(f'tengo premuto il sasso {hold:.1f}s'); g.responded(before, 600); g.advance(hold + 1.0)
            if hold < .9 and not hint():
                g.flag('confusione', 'ho mollato il sasso troppo presto: l’invito «Tieni premuto» è sparito e non so cosa fare', shot=True, tag='sasso')
        elif 'Trascina' in hh:
            before = g.sig()
            pg.mouse.move(VW * .5, VH * .2); pg.mouse.down(); pg.mouse.move(VW * .5, VH * .3, steps=6); pg.mouse.move(VW * .5, VH * .44, steps=6); pg.mouse.up()
            g.acts.append('trascino il sasso nel barattolo'); g.responded(before, 600); g.advance(2.5)
        elif 'battito' in hh:
            g.tap_xy(VW * .5, VH * .5, 'tocco il sasso', 0.8)
        elif pg.locator('[data-f=pick]').count():
            g.read(pg.inner_text('.f-ctl'))
            idx = {'curioso': 0, 'frettoloso': 2, 'distratto': 1, 'ostinato': 2}[g.persona]
            g.tap('[data-f=pick]', 'scelgo dove mettere il barattolo', nth=idx, think=1.5)
            g.tap('[data-f=next]', 'tocco «Avanti»', think=1.0)
        elif pg.locator('[data-f=next]').count() and pg.locator('[data-f=next]').is_enabled():
            g.tap('[data-f=next]', 'tocco «Avanti»', think=1.0)
        elif pg.locator('#f-nm').count():
            g.read(pg.inner_text('.f-ctl'))
            pg.fill('#f-nm', nome); g.acts.append(f'scrivo il nome «{nome}»')
            g.tap('[data-f=end]', 'tocco la fine del video', think=1.0)
        else:
            # nessun invito: leggo il testo e tocco per andare avanti
            t = pg.evaluate("document.body.innerText")
            g.read(t[:120])
            g.tap_xy(195, 420, 'tocco lo schermo per andare avanti', 0.5)
        pg.wait_for_timeout(450)
    pg.wait_for_timeout(2200)
    g.note('video finito, si entra nel gioco')




# ---------------- il gioco ----------------

NEED_LAB = {'um': 'Umidità', 'ter': 'Terreno', 'pul': 'Pulizia'}
CURA = {'um': 'acqua', 'ter': 'nutri', 'pul': 'pulisci'}


def bisogni(g):
    """Legge le tre pillole come le legge una persona: etichetta «Umidità 60%»."""
    out = {}
    for el in g.pg.evaluate("[...document.querySelectorAll('[data-a=needs][data-n]')].map(e=>[e.dataset.n,e.getAttribute('aria-label')])"):
        m = re.search(r'(\d+)%', el[1] or '')
        if m:
            out[el[0]] = int(m.group(1)) / 100
    return out


def pulsanti(g, root='.sheet'):
    return g.pg.evaluate("""(root)=>[...document.querySelectorAll(root+' [data-a]')].filter(e=>e.getClientRects().length).map(e=>({a:e.dataset.a,k:e.dataset.k||e.dataset.id||e.dataset.t||e.dataset.g||'',t:(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,60)}))""", root)


def bello(g, testo, shot=True):
    g.flag('bello', testo, shot=shot, tag='momento')


def gestisci_scheda(g):
    """Una scheda (notifica, decisione, pagina…) è aperta: la leggo e scelgo toccando."""
    pg = g.pg
    txt = g.sheet_text()
    titolo = (pg.evaluate("(document.querySelector('.sheet h2,.sheet h3')||{innerText:''}).innerText") or txt[:40]).strip()
    g.look()
    g.read(txt)
    btns = pulsanti(g)
    labels = [b['t'] for b in btns if b['t']]
    low = txt.lower()
    if 'mentre non c' in low and 'risveglio' not in g.seen_panels and g.persona in ('distratto', 'frettoloso'):
        g.seen_panels.add('risveglio')
        g.flag('confusione', f'torno dopo giorni: la scheda si intitola «{titolo}», dice cosa è successo, ma il pulsante è «{labels[0] if labels else "?"}» e non capisco dove mi porta', shot=True, tag='ritorno')
    nuovo = ('sheet:' + titolo) not in g.seen_panels
    g.seen_panels.add('sheet:' + titolo)
    if nuovo and any(w in low for w in ('è arrivato', 'nasce', 'popolo', 'mutazione')) and g.persona in ('curioso', 'ostinato'):
        bello(g, f'«{titolo}»: qualcosa di nuovo arriva nel vaso')
    scelte = [b for b in btns if b['a'] in ('dec', 'bis', 'gt', 'nb', 'arr-ok', 'serie-no', 'carta-gioca', 'req-go', 'task-ritira', 'fin-continue', 'fin-close', 'carta-ok', 'pausa-chiudi')]
    chiudi = [b for b in btns if b['a'] == 'sx' and b['t']]
    chip = [b for b in btns if b['a'] == 'grp']
    dec = [b for b in scelte if b['a'] in ('dec', 'gt', 'bis', 'nb')]

    def tocca_btn(c, perche):
        idx = [b['t'] + b['a'] for b in pulsanti(g)].index(c['t'] + c['a'])
        g.tap('.sheet [data-a]', f'{perche} «{c["t"][:30]}»', nth=idx, think=1.2)

    if dec:
        c = g.rnd.choice(dec) if g.persona == 'curioso' else (dec[-1] if g.persona == 'distratto' else dec[0])
        g.note(f'scheda «{titolo}»: scelgo «{c["t"]}» fra {[b["t"] for b in dec]}')
        tocca_btn(c, 'scelgo')
        return
    if scelte:
        c = scelte[0]
        if g.persona == 'distratto' and c['a'] == 'arr-ok' and chiudi and g.rnd.random() < .5:
            g.note(f'scheda «{titolo}»: la chiudo con «{chiudi[0]["t"]}», poi vedrò')
            g.tap('.sheet [data-a=sx]', f'tocco «{chiudi[0]["t"]}»', nth=pg.locator('.sheet [data-a=sx]').count() - 1, think=0.8)
            return
        g.note(f'scheda «{titolo}»: tocco «{c["t"]}» (altre opzioni: {[b["t"] for b in btns if b is not c][:3]})')
        tocca_btn(c, 'tocco')
        return
    if chip and g.persona == 'curioso':
        c = g.rnd.choice(chip)
        g.note(f'scheda «{titolo}»: apro il gruppo «{c["t"][:25]}»')
        tocca_btn(c, 'apro il gruppo')
        g.read(g.sheet_text())
        n = g.pg.locator('.sheet [data-a=sx]').count()
        if n:
            g.tap('.sheet [data-a=sx]', 'chiudo la scheda', nth=n - 1, think=0.6)
        return
    g.note(f'scheda «{titolo}»: la chiudo (opzioni viste: {labels[:4]})')
    n = pg.locator('.sheet [data-a=sx]').count()
    if n:
        g.tap('.sheet [data-a=sx]', 'chiudo la scheda', nth=n - 1, think=0.6)
    else:
        g.tap_xy(195, 60, 'tocco fuori dalla scheda', 0.6)


def overlay(g):
    """Se c'è qualcosa sopra il vaso lo gestisco. True se ho fatto qualcosa."""
    pg = g.pg
    if pg.locator('#cine').count():
        g.look(); g.advance(3.0 if g.persona == 'curioso' else 1.0, real_ms=1500)
        g.note('zoom sul vaso (Osserva)')
        if g.persona == 'curioso' and 'zoom' not in g.seen_panels:
            g.seen_panels.add('zoom'); bello(g, 'lo zoom ravvicinato sul vaso (Osserva)')
        g.tap('#cine', 'tocco per chiudere lo zoom', think=0.5)
        pg.wait_for_timeout(500)
        return True
    if pg.locator('#cardrev').count():
        pg.wait_for_timeout(900); g.look(); g.read(pg.inner_text('#cardrev'))
        if 'carta' not in g.seen_panels:
            g.seen_panels.add('carta'); bello(g, 'compare una carta ottenuta')
        g.tap('[data-a=carta-ok]', 'prendo la carta', think=0.8)
        return True
    if pg.locator('#reveal').count():
        pg.wait_for_timeout(1200); g.look(); g.read(pg.inner_text('#reveal'))
        if 'reveal' not in g.seen_panels:
            g.seen_panels.add('reveal'); bello(g, 'la rivelazione del finale')
        if pg.locator('[data-a=fin-continue]').count():
            g.tap('[data-a=fin-continue]', 'tocco «continua» nella rivelazione', think=1.0)
        elif pg.locator('[data-a=fin-close]').count():
            g.tap('[data-a=fin-close]', 'chiudo la rivelazione', think=1.0)
        else:
            g.tap_xy(195, 700, 'tocco lo schermo', 1.0)
        return True
    if pg.locator('.sheet').count():
        gestisci_scheda(g)
        return True
    return False


def svuota(g, n=12):
    for _ in range(n):
        if not overlay(g):
            break
        g.pg.wait_for_timeout(150)


def cura(g, soglia=.55, massimo=3):
    fatte = 0
    for k, v in sorted(bisogni(g).items(), key=lambda kv: kv[1]):
        if v < soglia and fatte < massimo:
            g.tap(f'[data-a=act][data-k={CURA[k]}]', f'{CURA[k]} (barra {NEED_LAB[k]} al {int(v*100)}%)', think=1.5)
            fatte += 1
            svuota(g)
    return fatte


def passa_notte(g):
    d0 = g.day()
    r = g.tap('[data-a=notte]', 'Passa la notte', think=1.5)
    g.pg.wait_for_timeout(500)
    svuota(g)
    if r is None:
        return None
    if g.day() == d0:
        g.flag('confusione', 'ho toccato «Passa la notte» ma il giorno non è cambiato e non so perché', shot=True, tag='notte')
    return g.day() - d0


def invito_cta(g):
    """Fase iniziale guidata: un solo pulsante grande."""
    if g.pg.locator('.cta').count():
        lab = g.pg.inner_text('.cta').strip().replace('\n', ' ')
        g.read(g.pg.evaluate("(document.querySelector('.vcap')||document.body).innerText")[:140])
        g.tap('.cta', f'tocco il pulsante grande «{lab}»', think=1.5)
        g.pg.wait_for_timeout(500)
        svuota(g)
        return True
    return False


def torna_al_vaso(g):
    pg = g.pg
    if pg.evaluate("__ui.tab") != 'vaso' and pg.locator('[data-a=tab][data-t=vaso]').count():
        g.look()
        g.read(pg.evaluate("document.body.innerText")[:240])
        g.tap('[data-a=tab][data-t=vaso]', 'torno al vaso', think=0.8)


def notifiche(g, tutte=True):
    n = 0
    for _ in range(4):
        loc = g.pg.locator('.nf')
        if not loc.count():
            break
        lab = loc.first.get_attribute('aria-label') or 'notifica'
        g.tap('.nf', f'apro la notifica «{lab[:30]}»', think=1.0)
        n += 1
        svuota(g)
        torna_al_vaso(g)
        if not tutte:
            break
    return n


def quaderno(g, a_fondo=True):
    pg = g.pg
    if not pg.locator('.qhandle').count():
        g.note('non vedo la maniglia del quaderno (' + pg.evaluate("'tab='+__ui.tab+' fase='+__app.G.ui.fase+' sheet='+document.querySelectorAll('.sheet').length+' cine='+document.querySelectorAll('#cine').length+' qh='+document.querySelectorAll('.qhandle').length") + ')')
        return False
    g.tap('.qhandle', 'apro il quaderno', think=1.5)
    g.read(pg.evaluate("document.body.innerText")[:300])
    tabs = [b for b in pulsanti(g, 'body') if b['a'] == 'cdx']
    if a_fondo:
        for b in tabs[:6]:
            g.tap(f'[data-a=cdx][data-t={b["k"]}]', f'quaderno: «{b["t"][:15]}»', think=3.0)
            g.read(pg.evaluate("document.body.innerText")[:200])
            svuota(g, 3)
    if pg.locator('[data-a=tab][data-t=vaso]').count():
        g.tap('[data-a=tab][data-t=vaso]', 'torno al vaso', think=1.0)
    return True


def menu(g, evita=('v3d', 'demo')):
    pg = g.pg
    if not pg.locator('[data-a=menu]').count():
        return
    g.tap('[data-a=menu]', 'apro il menu ⋯', think=1.5)
    voci = [b for b in pulsanti(g, 'body') if b['a'] == 'menu-go']
    g.note('menu: ' + ' / '.join(b['t'][:28] for b in voci))
    sc = [b for b in voci if b['k'] not in evita]
    if not sc:
        if pg.locator('.sheet [data-a=sx]').count():
            g.tap('.sheet [data-a=sx]', 'chiudo il menu', nth=pg.locator('.sheet [data-a=sx]').count() - 1)
        return
    b = g.rnd.choice(sc)
    g.tap(f'[data-a=menu-go][data-g={b["k"]}]', f'menu: «{b["t"][:25]}»', think=2.0)
    g.read(pg.evaluate("document.body.innerText")[:200])
    svuota(g, 4)
    if pg.locator('[data-a=tab][data-t=vaso]').count():
        g.tap('[data-a=tab][data-t=vaso]', 'torno al vaso', think=1.0)


def tocca_vaso(g):
    for (x, y) in ((195, 640), (120, 560), (260, 700)):
        g.tap_xy(x, y, f'tocco il vaso a ({x},{y})', 1.2)
        svuota(g, 3)


def giorno_stato(g):
    try:
        return g.pg.evaluate("(()=>{const v=__app.sim.view(); return {d:v.d, vive:v.sp.filter(x=>x.alive).map(x=>x.nome||x.id), needs:v.needs, fase:__app.G.ui.fase, cap:v.chapter, pending:v.pending.length}})()")
    except Exception:
        return {}


def nuova_visita(g, giorni):
    """Passano `giorni` giorni veri: la persona riapre il gioco (ricarica la pagina)."""
    pg = g.pg
    pg.evaluate("(n)=>{ __app.G.dev=__app.G.dev||{offset:0}; __app.G.dev.offset=(__app.G.dev.offset||0)+n; __app.persist(); }", giorni)
    pg.reload(); pg.wait_for_timeout(2200)
    g.clock += 3600 * 8 * giorni  # il tempo fuori dal gioco non conta come noia
    g.next_tick = g.clock + 10.0
    g.last_resp = g.last_novel = g.clock
    g.note(f'riapro il gioco dopo {giorni} giorno/i')
    g.look()


BUDGET = {'curioso': 420, 'frettoloso': 110, 'distratto': 150, 'ostinato': 260}


def provo_demo(g):
    pg = g.pg
    if not pg.locator('[data-a=menu]').count():
        return
    g.tap('[data-a=menu]', 'apro il menu ⋯', think=1.0)
    if pg.locator('[data-a=menu-go][data-g=demo]').count():
        d0 = g.day()
        g.tap('[data-a=menu-go][data-g=demo]', 'menu: «Scorri i giorni (demo)»', think=1.0)
        pg.wait_for_timeout(2500)
        g.advance(6)
        svuota(g)
        if pg.locator('#demoBtn').count():
            g.tap('#demoBtn', 'fermo lo scorrimento', think=0.8)
        svuota(g)
        g.note(f'ho provato lo scorrimento veloce: giorni {d0} → {g.day()}')
    else:
        svuota(g)


def visita(g, n):
    pg = g.pg
    p = g.persona
    t0 = g.clock
    st = giorno_stato(g)
    g.note(f'visita {n+1}: giorno del vaso {st.get("d")}, bisogni {({k: int(v*100) for k, v in (st.get("needs") or {}).items()})}, vivono {st.get("vive")}')
    g.last_resp = g.last_novel = g.clock
    svuota(g, 8)                       # risveglio, notti, decisioni arrivate nel frattempo
    zero = {k: v for k, v in bisogni(g).items() if v <= .02}
    if zero and 'zero' not in g.seen_panels and n > 0 and (pg.evaluate('__app.G.ui.fase') or 0) >= 3:
        g.seen_panels.add('zero')
        g.flag('frustrazione', f'riapro e trovo {", ".join(NEED_LAB[k] for k in zero)} a 0%: nessuno mi aveva avvisato prima', shot=True, tag='barra-zero')
    done_night = 0
    guard = 0
    while g.clock - t0 < BUDGET[p] and guard < 60:
        guard += 1
        if overlay(g):
            continue
        fase = pg.evaluate("__app.G.ui.fase")
        if fase is not None and fase < 3:
            if not invito_cta(g):
                passa_notte(g)
            continue
        if p == 'curioso':
            notifiche(g)
            if n % 2 == 0 and pg.locator('[data-a=needs][aria-label="Come sta il vaso"]').count():
                g.tap('[data-a=needs][aria-label="Come sta il vaso"]', 'tocco il giorno «Come sta il vaso»', think=1.5)
                svuota(g)
            cura(g, .7)
            if pg.locator('[data-a=osserva]').count() and n % 2 == 0:
                g.tap('[data-a=osserva]', 'tocco Osserva', think=1.0)
                pg.wait_for_timeout(1900); svuota(g)
            tocca_vaso(g)
            quaderno(g, a_fondo=(n < 3))
            menu(g)
            if pg.locator('[data-a=mazzo]').count() and n % 3 == 1:
                g.tap('[data-a=mazzo]', 'apro «Asso nella manica»', think=1.5); svuota(g)
            if n == 1 and 'demo' not in g.seen_panels:
                g.seen_panels.add('demo'); provo_demo(g)
            for _ in range(2):
                passa_notte(g); done_night += 1
            notifiche(g)
            break
        elif p == 'frettoloso':
            if pg.locator('.nf').count() and g.rnd.random() < .3:
                notifiche(g, tutte=False)
            b = bisogni(g)
            if b:
                k = min(b, key=b.get)
                if b[k] < .5:
                    g.tap(f'[data-a=act][data-k={CURA[k]}]', f'{CURA[k]} (la barra più bassa: {NEED_LAB[k]} {int(b[k]*100)}%)', think=1.0)
                    svuota(g)
            passa_notte(g); done_night += 1
            break
        elif p == 'distratto':
            if g.rnd.random() < .5 and pg.locator('.nf').count():
                notifiche(g, tutte=False)
            cura(g, .5, massimo=1)
            passa_notte(g); done_night += 1
            if done_night >= 2:
                break
        elif p == 'ostinato':
            for _ in range(8):
                before = bisogni(g).get('um')
                r = g.tap('[data-a=act][data-k=acqua]', f'acqua (barra Umidità {int((before or 0)*100)}%)', think=1.2)
                svuota(g)
                if r is None:
                    break
            passa_notte(g); done_night += 1
            for _ in range(3):
                if pg.locator('.nf').count():
                    notifiche(g, tutte=False)
            if done_night >= 2:
                break
    svuota(g, 6)
    g.advance(4.0)
    st2 = giorno_stato(g)
    g.note(f'fine visita {n+1}: giorno del vaso {st2.get("d")}, bisogni {({k: int(v*100) for k, v in (st2.get("needs") or {}).items()})}, vivono {st2.get("vive")}, durata {int(g.clock - t0)} s')


PIANO = {  # giorni veri trascorsi prima di ogni visita
    'curioso': [0] + [1] * 9,
    'frettoloso': [0] + [1] * 9,
    'distratto': [0, 3, 3, 3],
    'ostinato': [0] + [1] * 9,
}


def main(persona):
    out = os.path.join(ROOT, 'docs', 'giocatore')
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'screenshots', 'giocatore'), exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2)
        ctx.add_init_script("window.__no3d=true")
        pg = ctx.new_page()
        pg.set_default_timeout(5000)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.on('console', lambda m: errs.append('CON ' + m.text[:160]) if m.type == 'error' else None)
        pg.goto('file://' + os.path.join(ROOT, 'dist', 'terrario-gioco.html'))
        pg.wait_for_timeout(2200)
        g = Giocatore(pg, persona)
        gioca_video(g, {'curioso': 'Lumen', 'frettoloso': 'Casa', 'distratto': 'Stellina', 'ostinato': 'Piccolo Mondo'}[persona])
        for n, gap in enumerate(PIANO[persona][:int(os.environ.get('GIOC_VISITE', '99'))]):
            if n > 0:
                nuova_visita(g, gap)
            try:
                visita(g, n)
            except Exception as e:
                g.note(f'(il giocatore si è inceppato: {str(e)[:120]})')
                errs.append('GIOCATORE ' + str(e)[:200])
            if os.environ.get('GIOC_DEBUG'):
                print('visita', n, 'clock', int(g.clock), 'giorno', g.day(), 'shots', len(g.shots), flush=True)
        stato = giorno_stato(g)
        res = dict(persona=persona, data=DATA, stato_finale=stato, righe=g.rows, linea_del_tempo=g.timeline, segnalazioni=g.flags,
                   schermate=g.shots, errori_pagina=errs, vedute=sorted(g.seen_creat), no3d=True)
        with open(os.path.join(out, f'{DATA}-{persona}.log.json'), 'w') as f:
            json.dump(res, f, ensure_ascii=False, indent=1)
        b.close()
    print(persona, 'finito: giorno', stato.get('d'), 'segnalazioni', len(g.flags), 'schermate', g.shots, 'errori', errs[:3])


if __name__ == '__main__':
    persona = sys.argv[1] if len(sys.argv) > 1 else 'curioso'
    assert persona in PERSONE, PERSONE
    main(persona)
