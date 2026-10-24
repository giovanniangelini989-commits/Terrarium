// LOD ridotti dal tier swarm per raggruppamento a griglia (vertex clustering) dentro la stessa parte (_ANIM.xy):
// i vertici superstiti sono originali con tutti gli attributi (_ANIM, _PIVOT, _EMIT, UV); nessuna texture nel file.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import fs from 'node:fs';

const [src, outDir, c1, c2] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc0 = await io.read(src);
const prim = doc0.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION').getArray(), A = prim.getAttribute('_ANIM').getArray(), I = prim.getIndices().getArray();
const N = P.length / 3;

function cluster(cell) {
  const key2rep = new Map(); const rep = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    const k = A[i*4] + '/' + A[i*4+1] + '/' + Math.round(P[i*3]/cell) + ',' + Math.round(P[i*3+1]/cell) + ',' + Math.round(P[i*3+2]/cell);
    if (!key2rep.has(k)) key2rep.set(k, i); rep[i] = key2rep.get(k);
  }
  const seen = new Set(); const out = [];
  for (let i = 0; i < I.length; i += 3) {
    const a = rep[I[i]], b = rep[I[i+1]], c = rep[I[i+2]]; if (a === b || b === c || a === c) continue;
    const s = [a, b, c].sort((x, y) => x - y).join(','); if (seen.has(s)) continue; seen.add(s); out.push(a, b, c);
  }
  return out;
}

for (const [name, cell] of [['lod1', +c1], ['lod2', +c2]]) {
  const out = cluster(cell);
  const d = await io.read(src);
  const p2 = d.getRoot().listMeshes()[0].listPrimitives()[0];
  p2.setMaterial(null);
  for (const m of d.getRoot().listMaterials()) m.dispose();
  for (const t of d.getRoot().listTextures()) t.dispose();
  const used = [...new Set(out)].sort((a, b) => a - b); const map = new Map(); used.forEach((v, i) => map.set(v, i));
  for (const sem of p2.listSemantics()) { const a = p2.getAttribute(sem); const es = a.getElementSize(); const s = a.getArray(); const arr = new s.constructor(used.length * es); used.forEach((o, m) => { for (let k = 0; k < es; k++) arr[m*es+k] = s[o*es+k]; }); a.setArray(arr); }
  p2.getIndices().setArray(new Uint16Array(out.map(v => map.get(v))));
  await d.transform(prune({ keepAttributes: true }), dedup());
  const file = `${outDir}/formiche_${name}.glb`; await io.write(file, d);
  console.log(name, 'cella', cell, 'tris', out.length/3, 'vertici', used.length, 'byte', fs.statSync(file).size);
}
