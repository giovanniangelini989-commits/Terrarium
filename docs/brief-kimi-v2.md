# Terrario — 3D Asset Brief v2: Ultra-Real Miniature + Animation

Version 2.0 · supersedes the Pass 1 brief for everything not explicitly kept.
Owner of materials, lighting, camera and final QA: the game team. Owner of geometry, UVs, rigs and animation: you.

---

## 0. What changed since Pass 1

Pass 1 was accepted as a temporary base, and it is already live in the game. These are the fixes we need:

| Issue | Measured | Required |
|---|---|---|
| `formiche` too long | 0.239 | **0.20** body length (mandibles to abdomen tip, legs excluded) |
| `ragni` leg span too short | 0.233 | **0.55** leg span; body 0.22 |
| `coleotteri` short | 0.29 | **0.34** |
| `mosche` wingspan | 0.254 | **0.30** |
| Look of objects | flat vertex colours, faceted "plastic toy" | real materials (see §3), smooth shading, bevels |
| Colours baked in vertex colours | – | **material slots** (`aMat`), see §3; vertex colour only as AO / tint |

The game has moved to a **photographic look**: photo PBR textures on wood, soil, moss, rock and gravel; real sun shadows; reflection-only glass; and photo backgrounds. Next to that, faceted low-poly toys break the illusion. Everything you make from now on must survive a **macro close-up** at about 2 cm camera distance in game units (0.2).

---

## 1. Art direction: "ultra-real miniature"

One sentence: **it must look like macro photography of a real glass jar on a real desk.**

Rules:
1. **Real proportions, real anatomy.** Nothing chibi, nothing oversized for readability. Readability comes from the game's lighting and UI, not from distorted models.
2. **Real materials.** A teddy bear is plush with fibres. A clock is brass with wear on the edges and enamel on the dial. A beetle is glossy chitin with micro-pitting. Every surface belongs to one of the material slots in §3.
3. **No faceting.** Use smooth normals everywhere, except hard edges that are physically hard (a coin rim, a book corner). Bevel every hard edge (≥ 0.004 units); light catches bevels.
4. **Imperfection.** Nothing is perfectly symmetric or perfectly clean. Seeded variation per instance: ±6% scale, slight hue drift through the tint attribute, small asymmetries.
5. **Colour discipline.** Natural, slightly desaturated colours. Exactly two saturated accents exist in the whole game, and both are applied by us: the meteorite violet `#A88BFF` and the mutation green `#7CF5C8`. Do not introduce other saturated colours.
6. **Animation is physical.** Weight, inertia, overlap. Insects move with fast, twitchy, high-frequency motion; snails with slow peristaltic waves; the cat with soft overlapping action. No floaty, sine-only motion.

Reference mood: macro insect photography (shallow depth, crisp chitin highlights), vintage objects photographed on a wooden desk, warm late-afternoon window light.

---

## 2. Global technical constraints (unchanged unless noted)

- three.js **0.184**, ES module, single import `import * as THREE from 'three'`. No addons, loaders, files on disk, `fetch` or external assets.
- **1 unit = 10 cm**, Y up. Creatures face **+X**, objects face **+Z**. Origin on the ground contact point (min Y = 0).
- Deterministic: every builder takes `{ seed }` and produces the same result for the same seed.
- Every geometry is **indexed**, with `position`, `normal` and **`uv`** (new: required, non-overlapping where textures matter), `aMat`, `aEmit`, plus the animation attributes in §5.
- Target device: iPhone 12 and newer at 60 fps, minimum 30 fps. Assume we spend ≤ 6 ms per frame on everything you deliver.
- **Two levels of detail (new)** for creatures, objects and the cat:
  - **LOD1 "swarm/scene"**: what is on screen most of the time. Cheap, instanced, animated in the vertex shader.
  - **LOD0 "hero"**: used only when the camera zooms in on a group, an object or the cat. Detailed, skinned, with animation clips.

### Budgets

| Asset | LOD1 triangles | LOD0 triangles | LOD0 bones |
|---|---:|---:|---:|
| Creature (each species) | ≤ 400 | ≤ 3,000 | ≤ 24 |
| Object (each) | ≤ 900 | ≤ 6,000 | ≤ 8 (only if animated) |
| Plant (each, full growth) | ≤ 2,500 | – | – |
| Meteorite | ≤ 2,000 | ≤ 8,000 | – |
| Settlement (stage 4, all huts + landmark) | ≤ 4,000 | – | – |
| Biscotto the cat | – | ≤ 14,000 | ≤ 32 |
| **Worst-case scene** (84 creatures LOD1 + 3 objects + 4 plants + meteorite + 2 settlements) | **≤ 90,000** | at most 3 LOD0 heroes extra | |

Draw calls: one per species for LOD1 (InstancedMesh), at most 2 per object, at most 3 per hero.

---

## 3. Material contract: you assign slots, we own the materials

You **never create final materials**. Each triangle gets a material **slot id** through the vertex attribute `aMat` (Float32, integer values, constant per triangle). We build the materials from our library, with photo textures and PBR parameters, and we split your geometry into groups by slot.

For your own test sheet, use the placeholder values in the table so your previews resemble ours.

| id | slot | Used for | Placeholder (your sheet only) |
|---:|---|---|---|
| 0 | `chitina` | insect exoskeleton | Physical, roughness 0.32, clearcoat 0.6 |
| 1 | `chitina_opaca` | termite, soft insect bodies | Standard, roughness 0.6 |
| 2 | `occhio_composto` | insect eyes | Physical, roughness 0.15, clearcoat 1 |
| 3 | `ala` | fly wings, beetle hindwings | Physical, transmission-free, opacity 0.35, roughness 0.1, with vein texture |
| 4 | `conchiglia` | snail shell | Physical, roughness 0.4, clearcoat 0.5 |
| 5 | `pelle_umida` | snail body | Physical, roughness 0.25, clearcoat 0.8 (wet) |
| 6 | `peluche` | teddy fabric | Physical, roughness 1, sheen 1, sheenRoughness 0.8 |
| 7 | `plastica_lucida` | toy eyes, nose, buttons | Physical, roughness 0.12, clearcoat 1 |
| 8 | `ottone` | brass (clock, candle holder, radio dial) | metalness 1, roughness 0.32 |
| 9 | `metallo_brunito` | dark metal, clock hands | metalness 1, roughness 0.45 |
| 10 | `argento` | coin | metalness 1, roughness 0.25 |
| 11 | `smalto` | enamel dial | Physical, roughness 0.15, clearcoat 0.8 |
| 12 | `vetro_sottile` | clock crystal | handled by us like the jar glass |
| 13 | `specchio` | mirror surface | metalness 1, roughness 0.04 |
| 14 | `legno_lucido` | radio cabinet, mirror frame | Standard + wood map, roughness 0.45 |
| 15 | `pelle` | book cover (leather) | Standard, roughness 0.7 |
| 16 | `carta` | book pages | Standard, roughness 0.95 |
| 17 | `tessuto` | radio speaker grille | Standard, roughness 1 |
| 18 | `cera` | candle wax | Physical, roughness 0.55, sheen 0.3 |
| 19 | `fiamma` | candle flame | emissive, unlit, additive (we drive it) |
| 20 | `pietra` | statuette, stones | Standard + rock maps, roughness 0.85 |
| 21 | `ceramica` | glazed parts, hut details | Physical, roughness 0.3 |
| 22 | `foglia` | leaves, fronds | Standard, roughness 0.7, double-sided, alpha-tested |
| 23 | `fusto` | stems, stalks | Standard, roughness 0.8 |
| 24 | `muschio` | moss cushions | we own it (photo texture) |
| 25 | `fungo` | mushroom cap and gills | Physical, roughness 0.5, sheen 0.4 |
| 26 | `succulenta` | succulent leaves | Physical, roughness 0.35, clearcoat 0.3 |
| 27 | `roccia_meteorite` | meteorite body | we own it (photo rock + crack emission) |
| 28 | `terra_cruda` | huts (mud) | Standard + soil map |
| 29 | `paglia` | hut roofs (thatch) | Standard, roughness 1 |
| 30 | `pelo` | cat fur | we own it (shell fur, see §6.6) |
| 31 | `occhio_gatto` | cat eyes | Physical, clearcoat 1, iris texture from you |

Rules:
- Use only these ids. If you truly need a new slot, propose it in the README (name, use, PBR intent) and use the closest existing id meanwhile.
- **Vertex colour `color`** is allowed only as ambient occlusion and wear (grayscale 0.35–1.0) multiplied over the material. No hue in vertex colours, except the per-species tint ramp listed in §4.
- **UVs** are required for slots with textures (6, 8–11, 14–18, 20, 22, 24, 27–31). Texel density about **512 px per 0.1 unit** on LOD0 and about 128 px per 0.1 unit on LOD1.

### Procedural detail textures (you deliver these)
We already have photo textures for wood, soil, moss, rock and gravel. You deliver deterministic procedural textures (CanvasTexture, generated in code, 512×512 unless noted) for:

- `peluche_fibre`: normal-like fibre map and roughness.
- `ottone_usura`: scratches and edge wear mask.
- `smalto_quadrante`: clock dial with numerals; Roman, sepia, small chips.
- `pelle_libro`: leather grain plus a stamped title border.
- `carta_bordo`: page edge stripes.
- `tessuto_griglia`: speaker cloth weave.
- `ala_venature`: wing veins with an alpha mask (1024×512).
- `conchiglia_strie`: growth lines and banding.
- `chitina_micro`: micro-pitting normal map, tileable 256×256.
- `occhio_gatto_iride`: amber iris, 256×256.
- `pelo_maschera`: fur density and length mask for the cat, 1024×1024, tabby pattern.

API: `MODELS.textures.make(THREE, key, { size, seed })` returns a `THREE.Texture`, with colour space set correctly (sRGB for colour, linear for data).

---

## 4. Creatures (6 species)

Per species you deliver **LOD1** (instanced, vertex-shader animation) and **LOD0** (skinned hero).

| id | Length | Key anatomy to get right | Tint ramp allowed in `color` |
|---|---:|---|---|
| `formiche` | 0.20 | Head, thorax, **petiole node**, gaster; **elbowed antennae** (long scape plus segmented funiculus); 3-segment legs; mandibles | dark brown to near-black |
| `termiti` | 0.24 | Soft, pale, translucent-looking body; dark head (soldier-like); straight bead antennae; short legs | cream to amber head |
| `coleotteri` | 0.34 | Domed **elytra** with a central seam and fine punctures; pronotum; hindwings folded underneath (visible in fly/fight); clubbed antennae | iridescent green via the material, no colour baked |
| `ragni` | 0.22 body, **0.55 leg span** | Cephalothorax and abdomen; **8 legs, 7 segments each** (fine on LOD0); 4 pairs of eyes; pedipalps; chelicerae | brown with abdomen pattern in the AO channel |
| `lumache` | 0.38 | **Logarithmic-spiral shell** (4–5 whorls, growth lines through UV/texture); foot with a skirt; two long **eyestalks** with eye bulbs, two short tentacles | shell warm brown, body grey-beige |
| `mosche` | 0.19 body, 0.30 wingspan | Large **red compound eyes**; bristles (cards on LOD0); veined translucent wings; halteres; 6 legs | dark grey with a metallic thorax via the material |

Mutations (the game adds these, so design for them):
- `aEmit` (0–1) marks where mutation glow appears: veins along the body, eyes and joints. Not a uniform 1.
- Mutation "gigantism" scales instances up to 1.7×, so LOD1 must hold up at that size.
- Mutation "armour": provide an optional **armour plate overlay** per species as a separate small geometry (≤ 120 triangles) that snaps onto the thorax and abdomen, with slot `chitina`.

---

## 5. Animation contract

### 5.1 LOD1 swarm: vertex-shader animation (works with InstancedMesh)

Per-vertex attributes you deliver:

| Attribute | Type | Meaning |
|---|---|---|
| `aAnim` | vec4 | `x` = part id (see table below), `y` = limb index (legs 0–7, front to back, left then right), `z` = position along the limb (0 root → 1 tip), `w` = side (−1 left, +1 right, 0 centre) |
| `aPivot` | vec3 | joint origin this vertex rotates around (root of its part), in model space |
| `aEmit` | float | mutation glow mask |
| `aMat` | float | material slot |

Part ids: `0` body/thorax · `1` head · `2` abdomen/gaster · `3` antenna · `4` mandible/chelicera · `5` leg · `6` wing · `7` eyestalk/tentacle · `8` shell (snail) · `9` foot (snail) · `10` elytron.

Per-instance attributes the game sends:

| Attribute | Type | Meaning |
|---|---|---|
| `iAnim` | vec4 | `x` = phase offset 0–1 · `y` = speed (0 = still, 1 = normal walk, 2 = run) · `z` = state id · `w` = time in state, seconds |

State ids: `0` idle · `1` walk · `2` carry · `3` fight · `4` eat · `5` dead · `6` fly (flies and beetles only).

Uniforms the game sends: `uTime` (seconds), `uDry` (0–1, dehydration: slower, legs drag), `uNight` (0–1).

What you deliver: `MODELS.creatures[id].patchMaterial(material)`. It must install your vertex code with `material.onBeforeCompile` (merging with any existing hook, never replacing it), declare the attributes and uniforms above, and return the uniforms object so we can update `uTime`. The patch must work on both `MeshStandardMaterial` and `MeshPhysicalMaterial`, with instancing and shadows (also patch the depth material, or provide `customDepthMaterial`).

Required motion per state (all procedural, inside the shader):

| State | Insects (ant, termite, beetle) | Spider | Snail | Fly |
|---|---|---|---|---|
| idle | antenna sweeps (3–5 Hz, irregular), small body breathing, occasional leg shuffle | slow palp twitch, body still | eyestalks sway slowly, breathing pulse on the foot | wings folded, leg rubbing (grooming), every few seconds |
| walk | **alternating tripod gait**: legs L1-R2-L3 vs R1-L2-R3, stride frequency 6–9 Hz × speed, lift arc in Y, body bob 2× stride frequency | **wave gait**, 4 legs grounded at any time | **peristaltic wave** travelling back to front along the foot (0.6 Hz), shell sways slightly | short hops plus flutter |
| carry | walk, with head raised and mandibles closed (we attach the crumb) | – | – | – |
| fight | rear up on hind legs, front legs and mandibles strike (2–3 Hz) | front legs raised, fangs shown | eyestalks retract (z → 0) | erratic dart |
| eat | head down, mandibles chew at 4 Hz | fangs pulse | front of foot rasps | proboscis dab |
| dead | **on its back**, legs curled inward (z-weighted), no motion; transition 0.6 s using `iAnim.w` | legs curled | retracted into the shell | on its back, wings spread |
| fly | – (beetle: elytra open 70°, hindwings flap 60 Hz with blur by alpha) | – | – | wings flap 120 Hz, rendered as a blur cone (alpha flicker), body tilt |

Transitions: blend states over 0.25 s using `iAnim.w`; the game resets `w` to 0 on a state change.

### 5.2 LOD0 heroes: skinned, clip based

For each creature, `MODELS.creatures[id].buildHero(THREE, { seed })` returns:

```js
{
  mesh,              // THREE.SkinnedMesh, slots via aMat, groups split by us
  skeleton,          // bones named in snake_case: root, thorax, head, antenna_l_1…, leg_l1_1…
  clips: {           // THREE.AnimationClip, 30 fps, in place (no root motion)
    idle, walk, run, carry, fight, eat, die, groom
  },
  events: {          // seconds, for footstep / impact sounds
    walk: { contact: [0.00, 0.06, 0.12] }, fight: { hit: [0.21] }
  },
  length, materialHint
}
```

Clip rules: idle and walk loop seamlessly; `die` ends in the same pose as the LOD1 dead state, so we can swap LOD without popping. `walk` at clip speed 1.0 covers exactly 1 body length per stride cycle; report the cycle length in the README.

### 5.3 Plants

Per-vertex: `aSway` (0 at the base → 1 at the tips, already in Pass 1 naming), plus `aGrow` (0–1, the order in which the vertex appears as the plant grows).

Uniforms: `uGrow` (0–1), `uDry` (0–1), `uWind` (0–1), `uTime`.

Behaviour you implement in `patchMaterial`:
- **Growth:** a vertex is visible only once `uGrow ≥ aGrow`, unfolding from its parent, not scaling uniformly. **Fern fronds uncurl from fiddleheads.** Mushrooms push up and the cap opens. Succulent rosettes grow from the centre.
- **Dryness:** leaves curl downward and inward and colour drifts to straw (we provide the target colour as a uniform); fronds droop by `uDry × 25°`.
- **Sway:** gentle, height-weighted, two noise frequencies; amplitude ≤ 2° at `uWind = 0` (sealed jar), up to 10° when the lid is open.

Plants: `muschio` (we keep our photo cushions; you only deliver optional **sporophyte stalks**, about 200 thin stalks with capsules, instanced), `felce`, `fungo`, `succulenta`, `carnivora` (a sundew/Venus-flytrap hybrid whose traps snap shut through `uTrap` 0–1 per trap).

### 5.4 Meteorite

Body: ≤ 2,000 triangles (LOD1), ≤ 8,000 (LOD0), irregular fusion-crust stone about 0.42 across, regmaglypts (thumbprint dents) on the surface, slot `roccia_meteorite`. **No crystal facets.**

Deliver:
- `aCrack` (0–1) on vertices along a crack network that circles the stone: thin, branching, recessed by 0.006.
- `aGrowth` (0–1): for the "the stone grows" card, the crystal outcrops that appear, as a separate small geometry revealed by `uStoneGrow`.

We drive the emission (`uCharge`, `uPulse`) and the particles.

### 5.5 Objects

Each object gets LOD1 (scene) and LOD0 (close-up, optional bones). Same scale as Pass 1, with the slot mapping below.

| Object | Slots per part | Animation (object-space, uniforms or bones) |
|---|---|---|
| `statuina` | `pietra` body, `pietra` darker in AO for eyes/mouth, lichen spots via `aEmit = 0` and AO | none; **ants may build around it**, so provide 3 attachment points `attach_0..2` |
| `orologio` | `ottone` case and bell, `smalto` dial with `smalto_quadrante`, `metallo_brunito` hands, `vetro_sottile` crystal, `ottone` feet | hands rotate with real time (`hour`, `minute` bones or pivots); **alarm ring**: bell hammer vibrates at 20 Hz for 2 s (`uRing`) |
| `giocattolo` (teddy) | `peluche` body with `peluche_fibre`, `plastica_lucida` eyes and nose, stitched seams in the normal map | slump: head tilts slowly over game days (`uAge` 0–1); on LOD0, a fur fringe in 4 shell layers on the silhouette |
| `specchio` | `legno_lucido` frame, `specchio` surface | none (we render the reflection) |
| `libro` | `pelle` cover, `carta` pages with `carta_bordo` | **pages flutter** when the lid opens (`uWind`); cover can open 0–35° (`uOpen`) |
| `moneta` | `argento` with embossed relief (a face and lettering) in geometry on LOD0, normal map on LOD1 | glint is ours; none |
| `radio` | `legno_lucido` cabinet, `tessuto` grille, `ottone` dial and knobs, `vetro_sottile` dial window | dial needle sweeps (`uTune`), grille cloth vibrates subtly (`uVolume`) |
| `candela` | `cera` candle with drips, `ottone` holder, `fiamma` flame (separate mesh) | flame flickers procedurally (shape and intensity); wax height shrinks with `uBurn` 0–1 |

API (same as Pass 1, extended):

```js
MODELS.objects[id].build(THREE, { seed, lod: 1 })  // { group, size:{w,h,d}, attach:{...}, uniforms }
MODELS.objects[id].build(THREE, { seed, lod: 0 })  // same, high detail
```

### 5.6 Biscotto, the cat (hero only, outside the jar)

Biscotto is a young **tabby with white socks**. He appears next to the jar on the desk in story beats. Real cat scale: shoulder height about **2.4 units** (24 cm), body length about 4.5 units. He is larger than the jar, and that is the point.

- Geometry ≤ 14,000 triangles, ≤ 32 bones (spine 5, tail 6, neck/head 2, ears 2×2, jaw 1, 4 legs × 3–4).
- Fur: **shell fur**. The base mesh uses slot `pelo`; deliver `MODELS.cat.furShells(THREE, mesh, { shells: 10 })`, which returns extra skinned shell meshes sharing the skeleton, alpha from `pelo_maschera`, with length decreasing toward the paws and face. Must run at 60 fps on an iPhone 12 with 10 shells at 1/3 screen height. Fallback at `shells: 4`.
- Eyes: separate spheres with `occhio_gatto`, pupils scale through a morph target `pupil` (0 slit → 1 round).
- Morph targets: `pupil`, `blink`, `ears_back`, `mouth_open`.
- Clips (30 fps, in place unless stated): `sit_idle` (breathing, tail tip flicks, ear twitches; loop) · `stare` (ears forward, pupils widen, body low, tail swish; loop) · `paw_tap` (lifts the right paw onto the cork, taps twice; 2.2 s) · `knock` (pushes the jar with the paw; event `impact` at the contact frame) · `sleep_curl` (curled around the jar base; loop, slow breathing) · `walk_in` / `walk_out` (with root motion along +X; stride length reported) · `groom` (licks a paw; loop) · `gift_drop` (drops an item from the mouth; event `release`).

---

## 6. Settlements (Pass 4)

Ten cultures, four growth stages each: `formiche` and `termiti` build them, and other species borrow them. Huts are **0.32–0.40 across**, made of `terra_cruda` with `paglia` roofs and visible doorways. Each culture has a distinct landmark (0.40–0.70 tall):

`sacro` idol with offerings · `guerriero` palisade and banner · `mercante` stall with tiny goods · `scienza` tower with a lens · `nomade` tents · `artista` painted wall · `contadino` terraced field · `marinaio` boat on a puddle · `minatore` mine entrance with spoil heap · `oscuro` black monolith.

Animated parts through uniforms: flags (`uWind`), smoke anchor points (we emit particles at `attach_smoke_*`), window lights at night (`aEmit` masks, we drive them).

API: `MODELS.settlements.build(THREE, { culture, stage, seed })` returns `{ group, attach }`.

---

## 7. Delivery passes

| Pass | Contents | Notes |
|---|---|---|
| **2** | Pass 1 fixes (§0); `aMat` + UVs on all creatures and objects; LOD1 vertex animation for all 6 species (§5.1); procedural textures needed for creatures and objects (§3) | Highest priority; plugs straight into the live game |
| **3** | Creature heroes LOD0 with clips (§5.2); object LOD0 with animations (§5.5) | |
| **4** | Plants (§5.3), meteorite (§5.4), settlements (§6) | |
| **5** | Biscotto (§5.6) with fur shells | |

Each pass ships the same 4 files: `models.js`, `sheet.html`, `index.html` (a copy of the sheet), `README.md`.

---

## 8. Test sheet requirements (`sheet.html`)

Keep Pass 1's sheet and add:
- **Golden lighting preset** that matches the game. Directional sun `#ffd9a8` at intensity 2.8 from (2.4, 5.5, 2.6) with PCF shadows 1024; hemisphere light; ACES filmic tone mapping, exposure 1.08; neutral background `#2a211b`. Use this preset by default.
- **Placeholder materials** from the §3 table applied by slot, with a toggle "show slots" that colours each slot distinctly.
- **State selector** for LOD1 (all 7 states) and **clip selector** for LOD0, with a speed slider and a dry slider.
- **LOD toggle** and a "swap test" (the same individual switching LOD1 ↔ LOD0 every second, so popping is visible).
- **Swarm test**: 14 instances × 6 species walking in circles with random phases.
- **Perf panel**: ms per frame (average of 120 frames), draw calls, triangles, shader programs.
- **Macro camera** preset at distance 0.25 from a creature.

---

## 9. Acceptance checklist (our automated gate)

Every delivery runs through our script before it enters the game. It fails if any of these is false:

1. Loads with zero console errors and zero warnings.
2. Every builder is deterministic for the same seed (we hash the vertex buffers).
3. Measured sizes are within ±5% of the tables in §0, §4 and §5.5. Min Y = 0.
4. Triangle counts are within the budgets of §2 for every LOD.
5. Every geometry has `uv`, `aMat` (values only from §3), `aEmit`; creatures also `aAnim` and `aPivot`; plants `aSway` and `aGrow`.
6. No hue in vertex colours (saturation of `color` < 0.08).
7. `patchMaterial` compiles on Standard and Physical materials, with and without instancing, and in the shadow pass.
8. Swarm test with 84 creatures at 1×: ≤ 4 ms per frame in our headless benchmark (relative to the reference scene).
9. LOD0 `die` final pose matches the LOD1 dead state (vertex distance < 0.01).
10. A side-by-side contact sheet in our golden scene, next to the already approved assets, is approved by the art lead.

---

## 10. Do not

- Do not create final materials, lights, environment maps, post-processing or particles; those are ours.
- Do not bake hue into vertex colours.
- Do not use faceted flat shading or toy proportions.
- Do not add loaders, external files, `fetch` or extra imports.
- Do not change scale conventions, axes or origin.
- Do not replace existing `onBeforeCompile` hooks; chain them.

When something in this brief is unclear or conflicts with performance, choose the option that keeps **60 fps on iPhone 12** and note the trade-off in the README.
