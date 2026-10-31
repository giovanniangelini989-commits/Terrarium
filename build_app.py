sim=open('sim.js').read(); css=open('app/app.css').read()
a1=open('app/microclima.js').read()+'\n'+open('app/app1.js').read(); a2=open('app/app2.js').read(); a3=open('app/fx.js').read()+'\n'+open('app/carte.js').read()+'\n'+open('app/app3.js').read()+'\n'+open('app/scenari.js').read()
st=open('app/story.js').read()+'\n'+open('app/notti.js').read(); au=open('app/audio.js').read(); fl=open('app/apertura.js').read()+'\n'+open('app/film.js').read(); v3=open('app/modelli.js').read()+'\n'+open('app/piante.js').read()+'\n'+open('app/case.js').read()+'\n'+open('app/v3d.js').read(); km=open('app/kimi.js').read()+'\n'+open('app/materials.js').read()+'\n'+open('app/luci.js').read()+'\n'+open('app/tex.js').read()
# Modelli di Kimi incorporati (tier swarm e close + LOD derivati in vendor/lod): il gioco resta un solo file HTML
import base64, json, os, shutil, io
def _b64(path): return base64.b64encode(open(path,'rb').read()).decode('ascii')
GLB={}
for sp in sorted(os.listdir('assets/kimi')):
    d='assets/kimi/'+sp
    if not os.path.exists(d+'/close.glb'): continue
    tiers=('close',) if sp=='meteorite' else ('swarm','close')  # oggetti: basta il tier close
    GLB[sp]={t:_b64(d+'/'+t+'.glb') for t in tiers if os.path.exists(d+'/'+t+'.glb')}
    for t in ('lod1','lod2'):
        f='vendor/lod/'+sp+'_'+t+'.glb'
        if os.path.exists(f): GLB[sp][t]=_b64(f)
# Lumaca vera (assets/modelli/lumache, Magnific/Tripo): GLB close+swarm in __GLB; pelle mutata e bagliore in __GLBX (stessa UV, DECISIONI «Versioni mutate»).
# Pelle mutata ripulita dai puntini (mediano) e maschera del bagliore sfocata+soglia: resta luce lungo spirale e venature, niente puntini sul guscio.
from PIL import Image as _I, ImageFilter as _F
import numpy as _np
GLBX={}
_LU='assets/modelli/lumache'
if os.path.exists(_LU+'/close.glb'):
    GLB['lumache']={t:_b64(_LU+'/'+t+'.glb') for t in ('close','swarm') if os.path.exists(_LU+'/'+t+'.glb')}
    GLBX['lumache']={}
    def _webp(im,q): b=io.BytesIO(); im.save(b,'WEBP',quality=q); return base64.b64encode(b.getvalue()).decode('ascii')
    for t,(med,rad,sz) in {'close':(5,7,512),'swarm':(3,2,128)}.items():
        mu=_I.open(_LU+'/mutata_'+t+'.webp').convert('RGB').filter(_F.MedianFilter(med))
        GLBX['lumache']['mut_'+t]=_webp(mu,80)
        mk=_I.open(_LU+'/maschera_emissiva_'+t+'.png').convert('L').filter(_F.GaussianBlur(rad))
        a=_np.clip((_np.asarray(mk,dtype=_np.float32)/255-.11)/.24,0,1)
        GLBX['lumache']['glow_'+t]=_webp(_I.fromarray((a*255).astype('uint8')).resize((sz,sz),_I.BILINEAR).convert('RGB'),85)
FORM_B64=_b64('assets/modelli/formicaio/stadi.glb') if os.path.exists('assets/modelli/formicaio/stadi.glb') else ''
glb='window.__GLB='+json.dumps(GLB,separators=(',',':'))+';'
glb+='window.__FORMICAIO='+json.dumps(FORM_B64)+';'
glb+='window.__GLBX='+json.dumps(GLBX,separators=(',',':'))+';'
# Scenografia del video iniziale (app/apertura.js, agente finali): stessi file e stesso formato di __GLB ({id:{close}}),
# in una chiave a parte perché non sono specie. Il meteorite entra qui (solo close, mai hero: DECISIONI §5).
# Quando Kimi consegna la passata F basta mettere assets/kimi/<id>/close.glb e ricostruire.
APERTURA_SLOTS=['meteorite','barattolo','scrivania','finestra','lampada','quaderno','gelso','giardino','mano']
GLB_AP={i:{'close':_b64('assets/kimi/'+i+'/close.glb')} for i in APERTURA_SLOTS if os.path.exists('assets/kimi/'+i+'/close.glb') and not (GLB.get(i) or {}).get('close')}  # già in __GLB: apertura.js li legge da lì
glb+='window.__GLB_APERTURA='+json.dumps(GLB_AP,separators=(',',':'))+';'
# Materiali fotografici (assets/materiali/<id>/{colore,normale,ruvidezza,altezza}.webp, da tools/materiale_da_foto.py):
# entrano da soli come data URL WebP in window.__MAT_FOTO = {id:{colore,normale,ruvidezza,altezza}}; sorgente.png resta fuori.
MATF={}
for mid in sorted(os.listdir('assets/materiali')) if os.path.isdir('assets/materiali') else []:
    d='assets/materiali/'+mid
    if not any(os.path.exists(d+'/'+k+'.webp') for k in ('colore','maschera','panorama')): continue
    # file a parte sullo stesso sito (DECISIONI §5): il gioco resta leggero e il telefono li tiene in cache
    os.makedirs('dist/materiali/'+mid, exist_ok=True); MATF[mid]={}
    for k in ('colore','normale','ruvidezza','altezza','maschera','panorama'):
        if os.path.exists(d+'/'+k+'.webp'):
            shutil.copyfile(d+'/'+k+'.webp','dist/materiali/'+mid+'/'+k+'.webp'); MATF[mid][k]='materiali/'+mid+'/'+k+'.webp?v='+__import__('hashlib').md5(open(d+'/'+k+'.webp','rb').read()).hexdigest()[:8]  # il telefono scarica di nuovo una foto solo quando cambia
glb+='window.__MAT_FOTO='+json.dumps(MATF,separators=(',',':'))+';'
print('materiali fotografici:',{k:sorted(v) for k,v in MATF.items()})
print('scenografia apertura:',sorted(GLB_AP))
print('modelli incorporati:',{k:sorted(v) for k,v in GLB.items()},'base64',len(glb),'byte')

# Icone delle creature (assets/icone, da Giovanni): 128 px WebP in base64 -> window.__ICONE={id:dataURI}; le altre specie restano emoji
from PIL import Image
ICONE={}
for _id in ('formiche','lumache','orologio','termiti','coleotteri','ragni','mosche','collemboli','felce'):
    _f='assets/icone/'+_id+'.webp'
    if os.path.exists(_f):
        _im=Image.open(_f).convert('RGBA'); _im.thumbnail((128,128),Image.LANCZOS); _b=io.BytesIO(); _im.save(_b,'WEBP',quality=82,method=6)
        ICONE[_id]='data:image/webp;base64,'+base64.b64encode(_b.getvalue()).decode('ascii')
CARTE_ARTE={}
for _f in sorted(os.listdir('assets/carte')) if os.path.isdir('assets/carte') else []:
    if not _f.endswith('.webp'): continue
    _im=Image.open('assets/carte/'+_f).convert('RGB'); _im.thumbnail((600,600),Image.LANCZOS); _b=io.BytesIO(); _im.save(_b,'WEBP',quality=80,method=6)
    CARTE_ARTE[_f[:-5]]='data:image/webp;base64,'+base64.b64encode(_b.getvalue()).decode('ascii')
icone_js='window.__CARTE_ARTE='+json.dumps(CARTE_ARTE,separators=(',',':'))+';window.__ICONE='+json.dumps(ICONE,separators=(',',':'))+';'
print('icone:',{k:len(v) for k,v in ICONE.items()})
# Manifest minimale per «Aggiungi a Home»: icone 192/512 ricompresse (palette) e incorporate come data URI
def _png_small(path):
    _im=Image.open(path).convert('RGBA').quantize(128,method=Image.FASTOCTREE); _b=io.BytesIO(); _im.save(_b,'PNG',optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(_b.getvalue()).decode('ascii')
MANIFEST={"name":"Terrario","short_name":"Terrario","lang":"it","display":"standalone","orientation":"portrait","background_color":"#0F0D14","theme_color":"#0F0D14","start_url":".","icons":[{"src":_png_small('assets/brand/icona-192.png'),"sizes":"192x192","type":"image/png"},{"src":_png_small('assets/brand/icona-512.png'),"sizes":"512x512","type":"image/png","purpose":"any"}]}
MAN_URI='data:application/manifest+json;base64,'+base64.b64encode(json.dumps(MANIFEST,separators=(',',':')).encode()).decode('ascii')
MARCHIO=open('assets/brand/marchio.svg').read().split('?>',1)[-1]
MARCHIO=__import__('re').sub(r'<!--.*?-->','',MARCHIO,flags=__import__('re').S).strip().replace('<svg ','<svg class="mk" aria-hidden="true" ',1)
print('manifest',len(MAN_URI),'byte')
def _logo(n):
    _im=Image.open('assets/brand/logo_%s.png'%n).convert('RGBA')
    if _im.width>1200: _im=_im.resize((1200,round(_im.height*1200/_im.width)),Image.LANCZOS)
    _b=io.BytesIO(); _im.save(_b,'WEBP',quality=88,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(_b.getvalue()).decode('ascii')
# carta del quaderno (assets/materiali/carta_quaderno, foto di Giovanni): ritagliata su 19 righe esatte (passo 52,2 px) così si ripete senza stacchi
_c=Image.open('assets/materiali/carta_quaderno/colore.webp').convert('RGB').crop((0,24,1024,1016)); _c=_c.resize((640,round(640*992/1024)),Image.LANCZOS); _b=io.BytesIO(); _c.save(_b,'WEBP',quality=80,method=6)
CARTA_VAR='--carta-quaderno:url(data:image/webp;base64,'+base64.b64encode(_b.getvalue()).decode('ascii')+')'
LOGO_VARS=':root{'+CARTA_VAR+';--logo-scuro:url('+_logo('scuro')+');--logo-orizz:url('+_logo('orizzontale')+');--logo-chiaro:url('+_logo('chiaro')+')}'
SPLASH=base64.b64encode(open('assets/brand/splash.webp','rb').read()).decode()
# marchio e icona dell'app (assets/brand, da Giovanni): incorporati, così «Aggiungi a Home» mostra l'icona vera
ICO180=base64.b64encode(open('assets/brand/icona-180.png','rb').read()).decode(); FAV=base64.b64encode(open('assets/brand/favicon-64.png','rb').read()).decode()
html=f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0F0D14">
<title>Terrario</title>
<meta name="apple-mobile-web-app-title" content="Terrario">
<link rel="manifest" href="{MAN_URI}">
<link rel="apple-touch-icon" href="data:image/png;base64,{ICO180}">
<link rel="icon" type="image/png" href="data:image/png;base64,{FAV}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..500&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{LOGO_VARS}
{css}
</style>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js"}}}}</script>
</head>
<body>
<div id="app"><div id="screen" class="screen"></div><nav id="tabbar" class="glass" hidden aria-label="Sezioni"></nav></div>
<div id="layer"></div>
<div id="splash" class="splash" role="status" aria-label="Terrario si sta caricando"><img class="bg" alt="" src="data:image/webp;base64,{SPLASH}"><div class="sname" role="img" aria-label="Terrario"></div></div>
<script>
{icone_js}
</script>
<script>
{sim}
</script>
<script>
{st}
</script>
<script>
{a1}
</script>
<script>
{au}
</script>
<script>
{a2}
</script>
<script>
{fl}
</script>
<script>
{glb}
</script>
<script>
{km}
</script>
<script>
{v3}
</script>
<script>
{a3}
</script>
</body>
</html>
'''
open('dist/terrario-gioco.html','w').write(html); print('terrario-gioco.html',len(html),'byte')
