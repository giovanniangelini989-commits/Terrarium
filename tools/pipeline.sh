#!/bin/bash
# Terrario asset pipeline (brief v3 §4). Usage:
#   ./pipeline.sh source.glb <id> <body_length> "<qx,qy,qz,qw>" <class>
# Example (the reference ant, generated standing on its tail, back facing +X, head +Y):
#   ./pipeline.sh formica_cinematica.glb formiche 0.20 "0.7071068,0.7071068,0,0" organic
# Produces out/<id>/{hero,close,swarm}.glb and runs the acceptance gate on each.
set -e
SRC=$1; ID=$2; LEN=$3; ROT=$4; CLS=${5:-organic}
G=./node_modules/.bin/gltf-transform; O=out/$ID; T=$O/tmp; mkdir -p $T
$G weld "$SRC" $T/w.glb
# tier: name, max triangles, texture px, webp quality
for tier in "hero 60000 2048 86" "close 8000 1024 86" "swarm 1200 512 84"; do
  set -- $tier; N=$1; MAX=$2; PX=$3; QY=$4
  TOTAL=$(node -e "import('@gltf-transform/core').then(async({NodeIO})=>{const{ALL_EXTENSIONS}=await import('@gltf-transform/extensions');const d=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read('$T/w.glb');let t=0;d.getRoot().listMeshes().forEach(m=>m.listPrimitives().forEach(p=>t+=p.getIndices().getCount()/3));console.log(t)})")
  RATIO=$(node -e "console.log(Math.min(1,($MAX*0.97)/$TOTAL).toFixed(6))")
  $G simplify $T/w.glb $T/s_$N.glb --ratio $RATIO --error 0.03
  $G resize $T/s_$N.glb $T/r_$N.glb --width $PX --height $PX
  $G webp $T/r_$N.glb $T/c_$N.glb --quality $QY
  node normalize.mjs $T/c_$N.glb $O/$N.glb --len $LEN --rot "$ROT" $( [ "$CLS" = organic ] && echo --organic )
  node qa_gate.mjs $O/$N.glb --tier $N --len $LEN --class $CLS || echo "!! $ID/$N rejected by the gate: fix before delivery"
done
rm -rf $T
