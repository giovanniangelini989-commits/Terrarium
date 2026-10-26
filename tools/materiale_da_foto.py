#!/usr/bin/env python3
"""Trasforma una foto (vista dall'alto, luce piatta) in un materiale ripetibile per Terrario.
Uso: python3 tools/materiale_da_foto.py foto.png <id> [lato_px=1024] [rilievo=2.0] [raccordo=0.25]
Scrive assets/materiali/<id>/{colore,normale,ruvidezza,altezza}.webp
- colore: la foto resa ripetibile senza cuciture (fusione dei bordi con la copia spostata di mezzo lato)
- altezza: dalla luminanza, sfocata leggermente (le parti chiare sono più in alto)
- normale: dal gradiente dell'altezza (convenzione OpenGL, +Y in alto)
- ruvidezza: alta dove la superficie è opaca; i grani chiari (perlite) un po' meno ruvidi
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
src, mid = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
K = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
im = Image.open(src).convert('RGB')
s = min(im.size); im = im.crop(((im.width - s)//2, (im.height - s)//2, (im.width - s)//2 + s, (im.height - s)//2 + s)).resize((N, N), Image.LANCZOS)
a = np.asarray(im).astype(np.float32) / 255
# ripetibile: mescola l'immagine con se stessa spostata di N/2, con un peso che vale 1 al centro e 0 ai bordi
sh = np.roll(np.roll(a, N//2, 0), N//2, 1)
y, x = np.mgrid[0:N, 0:N] / (N - 1)
B = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25  # larghezza del raccordo ai bordi (frazione del lato): stretto per oggetti netti come i ciottoli
sm = lambda t: t * t * (3 - 2 * t)
# raccordo 0 = oggetto intero non ripetibile (coperchio, copertina): la foto resta com'è
w = np.ones((N, N, 1), np.float32) if B <= 0 else (sm(np.clip(np.minimum(x, 1 - x) / B, 0, 1)) * sm(np.clip(np.minimum(y, 1 - y) / B, 0, 1)))[..., None]
col = a * w + sh * (1 - w)
lum = col @ np.array([.2126, .7152, .0722], np.float32)
h = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
h = (h - h.min()) / max(1e-6, h.max() - h.min())
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * K; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * K
nz = np.ones_like(h); n = np.stack([-gx, gy, nz], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
nrm = (n * .5 + .5)
rough = np.clip(.92 - .25 * np.clip((lum - .55) * 3, 0, 1), .55, .95)
out = f'assets/materiali/{mid}'; os.makedirs(out, exist_ok=True)
def save(arr, name, mode='RGB', lato=None, q=80):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), mode)
    if lato and lato < N: img = img.resize((lato, lato), Image.LANCZOS)
    img.save(f'{out}/{name}.webp', quality=q, method=6)
save(col, 'colore', q=78); save(nrm, 'normale', lato=N//2, q=82); save(rough, 'ruvidezza', 'L', lato=N//4); save(h, 'altezza', 'L', lato=N//2)  # il colore porta il dettaglio, le altre mappe bastano più piccole
print(out, {f: os.path.getsize(f'{out}/{f}') for f in os.listdir(out)})
