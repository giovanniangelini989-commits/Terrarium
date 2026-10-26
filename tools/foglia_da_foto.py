#!/usr/bin/env python3
"""Scontorna una foglia fotografata su fondo grigio neutro e la prepara per il gioco.
Uso: python3 tools/foglia_da_foto.py foto.png <id> [angolo_gradi=45] [altezza_px=1024]
Scrive assets/materiali/<id>/{colore,normale}.webp: colore con trasparenza (alpha), la foglia verticale, punta in alto.
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
src, mid = sys.argv[1], sys.argv[2]
ang = float(sys.argv[3]) if len(sys.argv) > 3 else 45.0
H = int(sys.argv[4]) if len(sys.argv) > 4 else 1024
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32) / 255
mx, mn = a.max(-1), a.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-4)
g_dom = a[..., 1] - (a[..., 0] + a[..., 2]) / 2
# fondo grigio = poca saturazione; foglia e rachide = verdi o bruni (saturazione più alta)
al = np.clip((sat - .12) / .12, 0, 1)
al = np.maximum(al, np.clip((g_dom - .02) / .06, 0, 1))
A = Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.6))
rgba = im.copy(); rgba.putalpha(A)
rgba = rgba.rotate(ang, resample=Image.BICUBIC, expand=True)  # rachide verticale, punta in alto
bb = rgba.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); rgba = rgba.crop(bb)
w = max(2, round(rgba.width * H / rgba.height)); rgba = rgba.resize((w, H), Image.LANCZOS)
# il colore sotto le parti trasparenti si allarga dalla foglia (niente aloni grigi ai bordi)
arr = np.asarray(rgba).astype(np.float32); col = arr[..., :3]; al2 = arr[..., 3:] / 255
blur = np.asarray(Image.fromarray(col.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
wb = np.asarray(Image.fromarray((al2[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[..., None] / 255
fill = blur / np.maximum(wb, 1e-3); col = col * al2 + np.clip(fill, 0, 255) * (1 - al2)
out_rgba = np.concatenate([col, arr[..., 3:]], -1).astype(np.uint8)
lum = (col @ np.array([.2126, .7152, .0722])) / 255
h = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32) / 255
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 1.5; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 1.5
n = np.stack([-gx, gy, np.ones_like(h)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
out = f'assets/materiali/{mid}'; os.makedirs(out, exist_ok=True)
Image.fromarray(out_rgba, 'RGBA').save(f'{out}/colore.webp', quality=82, method=6)
Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8)).resize((max(2, w // 2), H // 2), Image.LANCZOS).save(f'{out}/normale.webp', quality=82, method=6)
print(out, rgba.size, {f: os.path.getsize(f'{out}/{f}') for f in os.listdir(out)})
