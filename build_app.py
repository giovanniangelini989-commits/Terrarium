sim=open('sim.js').read(); css=open('app/app.css').read()
a1=open('app/microclima.js').read()+'\n'+open('app/app1.js').read(); a2=open('app/app2.js').read(); a3=open('app/fx.js').read()+'\n'+open('app/carte.js').read()+'\n'+open('app/app3.js').read()+'\n'+open('app/scenari.js').read()
st=open('app/story.js').read()+'\n'+open('app/notti.js').read(); au=open('app/audio.js').read(); fl=open('app/film.js').read(); v3=open('app/modelli.js').read()+'\n'+open('app/v3d.js').read(); km=open('app/kimi.js').read()+'\n'+open('app/materials.js').read()+'\n'+open('app/tex.js').read()
# Modelli di Kimi incorporati (tier swarm e close + LOD derivati in vendor/lod): il gioco resta un solo file HTML
import base64, json, os
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
glb='window.__GLB='+json.dumps(GLB,separators=(',',':'))+';'
print('modelli incorporati:',{k:sorted(v) for k,v in GLB.items()},'base64',len(glb),'byte')
html=f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0A0F15">
<title>Terrario · prototipo giocabile</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200;500&family=Manrope:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,6..72,400&display=swap" rel="stylesheet">
<style>
{css}
</style>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js"}}}}</script>
</head>
<body>
<div id="app"><div id="screen" class="screen"></div><nav id="tabbar" class="glass" hidden aria-label="Sezioni"></nav></div>
<div id="layer"></div>
<div id="splash" class="splash"><div style="font-size:54px">🫙</div><div style="font-family:Unbounded,sans-serif;font-weight:200;font-size:30px;margin-top:10px;letter-spacing:.04em">TERRARIO</div><div class="muted" style="margin-top:12px">Il terrario si sta svegliando…</div><div class="muted faint" style="position:absolute;bottom:24px;font-size:11px">prototipo giocabile · titolo provvisorio</div></div>
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
