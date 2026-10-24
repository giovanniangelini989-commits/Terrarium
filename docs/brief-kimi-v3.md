# Terrario — 3D Asset Brief v3: photoreal pipeline

Version 3.0 · **replaces brief v2 as the production method.** The animation contract and the asset list of v2 still apply where this document does not change them.

The art lead approved one asset as **the quality bar for the whole game**: `formica_cinematica.glb`, an AI-generated photoreal ant. Every asset in the game must reach this level. This kit contains that ant processed through the official pipeline, the tools, the golden scene and the acceptance gate.

```
BRIEF.md                 ← this document
reference/               ← the quality bar, already processed (hero / close / swarm) + golden-scene render
tools/pipeline.sh        ← one command: source GLB → 3 approved tiers (13 s for the ant)
tools/normalize.mjs      ← axes, real scale, ground contact, organic = non-metal
tools/qa_gate.mjs        ← acceptance gate (we run the same script on every delivery)
golden/                  ← golden scene: same lights, tone mapping and desk as the game
```

Setup once: `cd tools && npm install`.

---

## 0. What changed from v2

| v2 | v3 |
|---|---|
| Procedural geometry written in code (`models.js`) | **AI-generated photoreal source meshes**, processed into GLB files |
| We owned all materials, you assigned slots | The **generator's PBR textures are the material**. We keep only special materials (glass, flame, emissive glow) |
| Budgets LOD1 ≤ 400 / LOD0 ≤ 3,000 triangles | **Three tiers measured on the reference ant**: swarm ≤ 1,200 · close ≤ 8,000 · hero ≤ 60,000 |
| Custom attributes `aAnim`, `aPivot`, `aEmit`, `aSway`, `aGrow` | Same meaning, **glTF names with underscore**: `_ANIM`, `_PIVOT`, `_EMIT`, `_SWAY`, `_GROW` (glTF requires the prefix for custom attributes) |

---

## 1. Quality bar

Open `reference/quality-bar_golden-scene.png`. Left to right: hero (60k), close (8k), swarm (1.2k) at macro distance, then 14 swarm ants at game distance. **That image is the minimum standard.** The swarm tier holds up even in macro because the detail lives in the normal map, not in the triangles.

Art direction, unchanged: **ultra-real miniature**, macro photography of a real glass jar on a real wooden desk. Real anatomy and proportions, real materials, natural slightly desaturated colours. Only two saturated accents exist in the game, both applied by us: meteorite violet `#A88BFF` and mutation green `#7CF5C8`.

---

## 2. Tiers and budgets

| Tier | Used for | Triangles | Textures | File |
|---|---|---:|---:|---:|
| `swarm` | Everything on screen during play, instanced | ≤ 1,200 | 512 px, WebP | ≤ 0.25 MB |
| `close` | Camera zoom on a group or an object | ≤ 8,000 | 1024 px, WebP | ≤ 0.8 MB |
| `hero` | Ending cinematics and macro shots only | ≤ 60,000 | 2048 px, WebP | ≤ 2.6 MB |

Scene worst case during play: 84 creatures (swarm) + 3 objects (close) + 4 plants + meteorite + 2 settlements ≤ **150,000 triangles**. Hero assets load only inside cinematics.

Textures per tier: base colour, ORM (glTF metallicRoughness: G = roughness, B = metallic) and **normal map in OpenGL convention** (+Y up, as in the reference: `NormalGL`).

---

## 3. Material rules (the gate checks the measurable ones)

1. **Organic = non-metal.** Chitin, shell, skin, plant, fur, wood, wax, paper, stone: `metallicFactor = 0`. The reference source had metallic at 29% on average (up to 76%), which makes an ant look like burnished iron under our lights. Use `--organic` in the pipeline.
2. **No baked lighting** in the base colour: no highlights, no cast shadows, no ambient occlusion darker than the material itself. The reference passes: mean luminance 0.22, 99th percentile 0.41, no near-white pixels.
3. **Real metals only where real**: brass, silver, steel. For those, metal ≥ 0.9 in the texture and the class is `metal` or `mixed`.
4. **Iridescent beetles**: still non-metal; use `KHR_materials_iridescence` for the structural colour, class `mixed`.
5. Special materials that **we** apply, so model them as **separate meshes or primitives with these exact material names**: `vetro` (any glass), `fiamma` (candle flame), `specchio` (mirror surface). Mutation glow comes from the `_EMIT` mask (0–1) on vertices of veins, eyes and joints.
6. Do not create lights, environment maps, cameras or post-processing in the files.

---

## 4. Pipeline per asset

1. **Generate** the source with the AI 3D generator, using the prompt template in §7. **Rest pose is mandatory**: the reference ant has its front legs raised in an attack pose, which cannot be animated. Regenerate it standing, with all six tarsi on the ground.
2. **Inspect** the source in the golden scene. Reject sources with baked lighting, wrong anatomy, fused legs or holes.
3. **Segment** moving parts (§5): rigid parts for arthropods and objects, bones for soft bodies.
4. **Animate** the hero tier (clips in §5).
5. **Produce the tiers**: `tools/pipeline.sh source.glb <id> <body_length> "<qx,qy,qz,qw>" <class>`. It welds, simplifies to each budget, resizes and converts textures to WebP, normalizes and runs the gate.
6. **Normalize** (inside the pipeline): forward **+X**, up **+Y**, ground contact at **y = 0**, real scale (**1 unit = 10 cm**; the body length is measured along X, excluding legs and antennae), transforms baked into vertices (identity node transforms, except animated parts). The rotation argument maps the generator's axes to ours. The reference ant came out standing on its tail (back facing +X, head +Y): `"0.7071068,0.7071068,0,0"`.
7. **Gate**: every file must print `APPROVATO`.
8. **Contact sheet** in the golden scene, next to the quality bar.

If segmentation or animation must happen before simplification, simplify each part separately and keep the part hierarchy.

---

## 5. Animation

### 5.1 Arthropods (ant, termite, beetle, spider, fly): **rigid segmentation, no skinning**
Insects have rigid exoskeletons, so cut the source at real joints into rigid parts and animate the parts. This is both anatomically correct and cheap.

Part hierarchy (node names, snake_case): `root → thorax → head → {antenna_l_1, antenna_l_2, antenna_r_1, antenna_r_2, mandible_l, mandible_r}`, `thorax → petiole → gaster` (ant, termite), `thorax → leg_l1_coxa → leg_l1_femur → leg_l1_tibia → leg_l1_tarsus` for each leg (`l1 l2 l3 r1 r2 r3`; spider `l1–l4`, `r1–r4`), beetle `elytron_l`, `elytron_r`, `hindwing_l`, `hindwing_r`, fly `wing_l`, `wing_r`.

Each node's origin sits exactly on its joint pivot.

- **hero tier**: glTF node animations (TRS), 30 fps, in place, loop-seamless where marked. Clips: `idle`↺, `walk`↺, `run`↺, `carry`↺, `fight`↺, `eat`↺, `groom`↺, `die` (ends in the dead pose), plus `fly`↺ for beetle and fly. Walk = alternating tripod (L1-R2-L3 vs R1-L2-R3) for insects, wave gait for the spider. Report the stride length of `walk` in `meta.json`.
- **swarm and close tiers**: merge the parts into **one primitive** (for instancing) and keep the segmentation as vertex attributes:
  - `_ANIM` (vec4): `x` part id (0 thorax · 1 head · 2 gaster · 3 antenna · 4 mandible · 5 leg · 6 wing · 7 eyestalk · 8 shell · 9 foot · 10 elytron), `y` limb index (front to back, left then right), `z` position along the limb 0 root → 1 tip, `w` side (−1 left, +1 right, 0 centre).
  - `_PIVOT` (vec3): the joint the vertex rotates around, in model space.
  - `_EMIT` (float): mutation glow mask.
  
  We drive these with our vertex shader. The per-state motion table of brief v2 §5.1 still describes what we expect, so you can preview it, but you do not have to write the shader.
- The `die` final pose of the hero must match the dead pose that our shader produces (on its back, legs curled), so swapping tiers does not pop.

### 5.2 Snail: skinned
`root → foot_1…foot_6` along the body, plus `eyestalk_l`, `eyestalk_r`, `tentacle_l`, `tentacle_r`; the shell is rigid on `foot_3`. Clips: `idle`, `crawl` (peristaltic wave back to front), `retract` (into the shell), `die`. Swarm tier: `_ANIM` with `x = 9` (foot) and `z` = position along the body for our wave shader.

### 5.3 Plants
`_SWAY` (0 base → 1 tip) and `_GROW` (0–1, the order in which the vertex appears as the plant grows). Fern fronds must **uncurl from fiddleheads**: deliver a morph target `uncurl` (0 = fiddlehead, 1 = open frond) on each frond. Carnivorous plant: morph target `trap_close` per trap.

### 5.4 Objects
Moving parts as separate child nodes with pivots at the joints: clock `hand_hour`, `hand_minute`, `bell_hammer`; book `cover` (hinge on the spine), `pages`; radio `dial_needle`; candle `flame` (separate mesh named `fiamma`) and `wax` (scaled by us as it burns); teddy `head` (slow tilt); statuette `attach_0..2` empty nodes where ants may build.

### 5.5 Biscotto, the cat
Skinned, ≤ 32 bones (spine 5, tail 6, neck/head 2, ears 2×2, jaw 1, legs 4 × 3–4). Morph targets: `pupil`, `blink`, `ears_back`, `mouth_open`. Clips: `sit_idle`↺, `stare`↺, `paw_tap`, `knock` (event `impact`), `sleep_curl`↺, `walk_in`, `walk_out` (root motion along +X), `groom`↺, `gift_drop` (event `release`). Fur comes from the generator texture. If the generator offers auto-rigging for quadrupeds, use it and fix the weights by hand where needed.

---

## 6. Delivery format

```
<id>/
  hero.glb  close.glb  swarm.glb        (objects and plants: hero optional)
  source-preview.png                     render of the raw generator output
  contact-sheet.png                      golden scene: hero, close, swarm + 14 swarm instances
  meta.json
```

`meta.json`:
```json
{ "id": "formiche", "version": "3.0.1", "class": "organic",
  "body_length": 0.20, "triangles": { "hero": 59966, "close": 7746, "swarm": 1192 },
  "parts": ["root","thorax","head","antenna_l_1", "..."],
  "clips": { "walk": { "loop": true, "stride": 0.11 }, "die": { "loop": false } },
  "generator": { "tool": "...", "prompt": "...", "seed": "...", "license": "commercial use allowed: yes/no" } }
```

**License**: the game ships on the App Store. Confirm in `meta.json` that the generator's terms allow commercial use of the output. Assets without that confirmation cannot be used.

---

## 7. Generation prompts

Template (adapt to the generator's syntax):

> Photorealistic 3D model of **[subject]**, real-world anatomy and proportions, macro photography realism. **[pose]**. Single object, centred, no base, no ground plane, no background. Physically based materials, neutral albedo with **no baked lighting, highlights or shadows**, natural slightly desaturated colours. **[material notes]**.

| id | Subject | Body length (units) | Pose | Material notes |
|---|---|---:|---|---|
| `formiche` | Red wood ant worker (*Formica rufa*): reddish-brown head and thorax, dark brown gaster, elbowed antennae, petiole node, closed mandibles | 0.20 | Standing, all six tarsi on the ground, legs spread symmetrically, antennae forward at 30° | Glossy chitin with fine pitting and sparse hairs |
| `termiti` | Worker termite: pale cream translucent soft body, amber-brown head, short straight beaded antennae | 0.24 | Standing, six tarsi on the ground | Soft matte cuticle, slightly translucent |
| `coleotteri` | Rose chafer (*Cetonia aurata*): domed elytra with central seam and fine punctures, clubbed antennae | 0.34 | Standing, elytra closed | Iridescent green structural colour, non-metal |
| `ragni` | Wolf spider (*Lycosidae*): brown-grey banded legs, eight eyes (two large forward), pedipalps | 0.22 body, leg span 0.55 | Standing, eight legs spread evenly | Matte hairy body, glossy eyes |
| `lumache` | Garden snail (*Cornu aspersum*): brown banded shell with 4–5 whorls and growth lines, two long eyestalks | 0.38 | Crawling, eyestalks extended | Wet glossy grey-beige skin, shell semi-gloss |
| `mosche` | Common housefly (*Musca domestica*): grey striped thorax, large red-brown compound eyes, bristles | 0.19 body, wingspan 0.30 | Standing, wings folded flat over the abdomen | Translucent veined wings |
| `statuina` | Small weathered stone idol head, primitive carving, lichen spots | height 0.55 | Upright | Porous stone, matte |
| `orologio` | Vintage brass twin-bell alarm clock, cream enamel dial with Roman numerals, worn edges | height 0.62 | Upright, facing +Z | Brass (metal), enamel, glass crystal as `vetro` |
| `giocattolo` | Small vintage teddy bear, worn mohair plush, glass button eyes, stitched nose | height 0.60 | Sitting | Plush with fibres, glossy eyes |
| `specchio` | Small hand mirror with gilded oval frame | height 0.84 | Standing on its edge, facing +Z | Gilded metal frame, surface as `specchio` |
| `libro` | Tiny old leather-bound book, worn corners, page edges visible | 0.71 × 0.52 | Lying closed | Leather, paper |
| `moneta` | Old worn silver coin with a face in relief and lettering | Ø 0.30 | Standing on its edge, facing +Z | Silver (metal) |
| `radio` | Miniature 1950s tube radio, wooden cabinet, fabric grille, brass dial | width 0.60 | Upright, facing +Z | Varnished wood, fabric, brass, dial window as `vetro` |
| `candela` | Short white candle with wax drips in a brass holder | height 0.64 | Upright | Wax (subsurface look), brass; flame as `fiamma` |
| `felce` | Young fern with several fronds and fiddleheads | height 1.0 | Upright | Matte green fronds, double-sided |
| `fungo` | Small cluster of brown *Mycena* mushrooms | height 0.35 | Upright | Slightly translucent caps, visible gills |
| `succulenta` | *Echeveria* rosette | Ø 0.60 | Upright | Waxy blue-green leaves |
| `carnivora` | Sundew (*Drosera*) with glandular tentacles and dew drops | height 0.50 | Upright | Red tentacles, glossy dew |
| `meteorite` | Stone-iron meteorite with dark fusion crust, regmaglypts (thumbprint dents) and a fine crack network. **No crystals** | Ø 0.42 | Resting on its flattest side | Matte crust; cracks as `_EMIT` mask |
| `capanna` | Ant-built mud hut: clay and soil walls, roof of dry grass thatch, small doorway | Ø 0.32–0.40 | Upright | Earth, straw |
| `biscotto` | Young tabby cat with white socks | shoulder height 2.4 | Sitting, looking forward | Realistic fur |

Moss stays ours (photo cushions). Settlement landmarks (ten cultures) follow in a later pass with their own prompts.

---

## 8. Delivery passes

| Pass | Contents |
|---|---|
| **A** | The ant regenerated in rest pose + the other 5 creatures: all three tiers, rigid segmentation, `_ANIM` / `_PIVOT` / `_EMIT`, hero clips |
| **B** | The 8 objects (close + swarm; hero for clock, teddy and candle), moving parts |
| **C** | Plants and meteorite |
| **D** | Huts (4 growth stages) and the ten landmarks |
| **E** | Biscotto |

Start with pass A, ant first, and send it alone before the others so we can validate segmentation and animation early.

---

## 9. Acceptance

A delivery is accepted when:

1. `node tools/qa_gate.mjs <file> --tier <tier> --len <length> --class <class> [--clips idle,walk,...]` prints **APPROVATO** for every file.
2. The contact sheet in the golden scene matches the quality bar. Judged by the art lead, side by side with `reference/quality-bar_golden-scene.png`.
3. Rest pose, anatomy and proportions are correct; no fused or floating parts.
4. Hero clips loop without visible seams; `die` ends in the dead pose.
5. `meta.json` is complete, including the commercial-use license confirmation.

## 10. Do not

- Do not deliver raw generator output: it was 1.46 M triangles and 57 MB for one ant.
- Do not leave metal on organic materials.
- Do not bake lighting into textures.
- Do not use poses with raised or crossed limbs as the rest pose.
- Do not change axes, scale or ground contact: run `normalize.mjs`.
- Do not add lights, cameras, environment maps or post-processing to the files.
