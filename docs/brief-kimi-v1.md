# TERRARIO — 3D Model Brief (for Kimi)

> You are a senior technical artist + Three.js engineer. Build the 3D assets for a mobile game called **Terrario**, as **procedural Three.js code** (no external files). Follow this brief exactly. Where something is ambiguous, pick the simplest reading, document the choice in the README, and keep going.

---

## 0. How to work (read first)

- **Work in 3 passes.** Do not try to output everything at once.
  - **Pass 1:** `sheet.html` + scale reference + all 6 **creatures** + all 8 **objects**.
  - **Pass 2:** **plants** (5), **meteorite**, **jar/table/gravel/soil**.
  - **Pass 3:** **settlement pieces** (huts + 10 landmarks) + the **cat** (bonus).
- **Never truncate a file.** If you run low on space, stop at a clean module boundary and write `CONTINUE`. I will reply "continue".
- **Deliver, at the end of each pass:** the complete updated files (not diffs), plus a short table: model → triangle count → draw calls.
- **Everything must run offline-ish:** the only external dependency is `three@0.184.0` ES module via an import map (see §7). No loaders, no addons, no textures from disk.

---

## 1. The game in 60 seconds

A child (the player) puts a small **meteorite** into an empty glass jam jar. The player cares for the jar by hand: soil, water, moss, a fern, then insects arrive. Over days the meteorite's radiation mutates the creatures; the ants may form a **society** (villages, cults, wars). It is a quiet, strange, tender story about a tiny world — **Sky: Children of the Light / Journey** mood (warm light, calm, minimal), not a cartoon and not a realistic simulator.

- **Platform:** iPhone (Safari/WebGL2), sessions of hours → must be **light on GPU and battery**.
- **Camera:** a perspective camera looking at the jar from slightly above (polar ≈ 69° from up), FOV 36°, default distance ≈ 3.8 units, can orbit ±75° and zoom in to ≈ 1.5 units for close-ups (zoom on events).
- **The player sees the jar small** (about 360 px wide) most of the time, and big during cinematic zooms. Models must read at both distances: **silhouette first, detail second**.
- Day/night: warm sunlight by day, cold moonlight + glowing mutations at night.

---

## 2. Deliverables (file contract)

```
/models.js      ← one ES module, the single source of truth (exports MODELS)
/sheet.html     ← self-contained test page (turntable, scale rulers, stats)
/README.md      ← triangle/draw-call table, choices made, known limits
```

`models.js` must be a standalone ES module with **no imports** except `import * as THREE from 'three'` (resolved by the import map). Export:

```js
export const MODELS = {
  meta: { unit_cm: 10, version: '1.0' },
  creatures: { formiche, termiti, coleotteri, ragni, lumache, mosche },   // §6.A
  objects:   { statuina, orologio, giocattolo, specchio, libro, moneta, radio, candela }, // §6.B
  plants:    { muschio, felce, fungo, succulenta, carnivora },            // §6.C
  meteorite, jar,                                                          // §6.D
  huts, landmarks: { sacro, sapere, commercio, gioco, mistero, comunicazione, fuoco, agricoltura, tribale, guerra }, // §6.E
  cat,                                                                      // §6.F (bonus)
};
```

Each entry has a `build(THREE, opts)` function (signatures in §7). **No global side effects.** Everything deterministic: use a small seeded PRNG (`mulberry32`), never bare `Math.random()`.

---

## 3. Global rules

- **Units:** 1 unit = **10 cm**. Y is up. The model's **origin is at the center of its base, touching y = 0** (the ground). **Forward = +X** for creatures; **front = +Z** for objects/landmarks.
- **Handedness / winding:** counter-clockwise front faces; **no negative scales** (the game uses instancing and mirrored scales break normals).
- **Materials:** the game uses a single `MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.05 })` per model. **Bake colors into a `color` vertex attribute.** Do not create your own materials for creatures/huts (we supply them). For special surfaces (glass, metal, emissive) you **may** return a `materials` hint (see §7), but the geometry must still look right with the default.
- **Geometry:** indexed `BufferGeometry` with `position`, `normal` (smooth or flat as the style needs), `color` (vec3, linear space), and the **optional custom attributes** in §4. `computeBoundingSphere()` done.
- **Merging:** write your own small `mergeParts(parts)` helper (positions/normals/colors/index offsets). **Do not** import `BufferGeometryUtils`.
- **No Z-fighting, no inner faces** hidden inside the mesh (waste of triangles), no degenerate triangles, no overlapping coplanar faces.
- **Draw calls:** every model = **1 draw call** unless stated otherwise (max 3 for hero pieces).
- **Budgets (triangles, whole model):**

| Item | Budget (merged) | Optional `hero` LOD (close-ups) |
|---|---|---|
| each creature | **≤ 350** | ≤ 1,400 |
| each object | ≤ 600 | — |
| each plant | ≤ 2,500 | — |
| hut | ≤ 250 | — |
| each landmark | ≤ 1,000 | — |
| meteorite | ≤ 1,500 | — |
| jar (glass + lid) | ≤ 3,000 | — |
| cat (bonus) | ≤ 3,500 | — |

Worst case on screen is ≈ 6 species × 14 instances each, plus 2 settlements: stay inside the budgets, they are not negotiable.

---

## 4. Optional custom attributes (please provide — they unlock animation and glow)

Add these to creature and plant geometries. They are cheap and let the game animate instanced meshes in a vertex shader without CPU skinning.

| Attribute | Type | Meaning |
|---|---|---|
| `aAnim` | vec2 | `x`: part class — `0` body (rigid), `1` leg, `2` antenna, `3` wing, `4` jaw/mouth, `5` plant-sway. `y`: phase offset in [-1, 1] (e.g. alternate legs ±1, opposite sides opposite sign). |
| `aEmit` | float 0..1 | Glow mask (mutation glow: abdomen tip, cracks, eyes…). The game multiplies it by a mutation color. |
| `aSway` | float 0..1 | **Plants only:** 0 at the base, 1 at the free tip (used for wind sway). |

If you don't want to do `aAnim`, still write zeros — but I will be much happier if the legs/antennae/wings are tagged.

---

## 5. Scale study (the part everybody gets wrong — read twice)

Previous attempt problems: ants were as big as the figurine, objects were tiny next to creatures, huts were as small as one ant. Fix it with this system.

**Rule 1 — Objects are real-scale, creatures are exaggerated.** Objects are things from a child's pocket (real sizes). Creatures are tiny in reality; we enlarge them by a **uniform ≈ ×3.3** so they are legible, **keeping their real order of size**.

**Rule 2 — Buildings are built by their inhabitants.** A hut must be **≈ 2× the ant's length** wide; landmarks **1.5–3× the ant's length** tall.

**Rule 3 — Reference frame (do not change):**

| Reference | Real | Game (units) |
|---|---|---|
| Jar inner diameter | 20 cm | **2.00** (radius 1.00) |
| Jar total height (to lip) | ≈ 15 cm | **1.56** |
| Gravel layer | 1 cm | 0.10 |
| Soil layer (varies) | 0.5–4.5 cm | 0.05–0.45 |
| Meteorite | ≈ 4.2 cm, lumpy | **radius ≈ 0.21**, slightly flattened |

**Creatures** (length, nose to tail, in units; body height ≈ 35–55% of length):

| Species | Real | ×factor | **Game length** | Notes |
|---|---|---|---|---|
| `formiche` (ant) | 0.6 cm | ×3.3 | **0.20** | the main character |
| `termiti` (termite) | 0.8 cm | ×3.0 | **0.24** | pale, soft, segmented |
| `coleotteri` (beetle) | 1.5 cm | ×2.3 | **0.34** | glossy shell |
| `ragni` (spider) | 1.0 cm body | ×2.2 | body **0.22**, leg span **0.55** | 8 legs |
| `lumache` (snail) | 3 cm | ×1.3 | **0.38** (shell Ø 0.20) | slow, tender |
| `mosche` (fly) | 0.7 cm | ×2.6 | **0.18**, wingspan **0.30** | hovers |

**Objects** (real size, 1×):

| Object | Real | **Game** (W×H×D or Ø×H, units) | Suggests culture |
|---|---|---|---|
| `statuina` stone figurine | 5.5 cm tall | 0.40 × **0.55** × 0.30 | sacred / cult |
| `orologio` pocket clock | Ø 5 cm, 2 cm thick | Ø **0.50** × 0.20 (standing on a small base) | science / knowledge |
| `giocattolo` teddy | 6 cm | 0.45 × **0.60** × 0.40 | play / carnival |
| `specchio` hand mirror | Ø 6 cm + 3 cm handle | Ø **0.55**, total height 0.85 | mystery |
| `libro` small book | 7 × 5 × 1.2 cm | **0.70** × 0.12 × 0.50 | knowledge |
| `moneta` coin (standing) | Ø 3 cm | Ø **0.30** × 0.04 | market / trade |
| `radio` pocket radio | 6 × 3.5 × 2 cm | **0.60** × 0.35 × 0.20 (+ antenna to 0.55 high) | voices / communication |
| `candela` candle stub | Ø 1.5 cm × 6 cm | Ø **0.15** × **0.60** | fire |

**Plants:**

| Plant | Game size |
|---|---|
| `muschio` (moss) | a lush mound, Ø ≈ 0.65, height ≈ 0.12–0.18; **not** a string of balls — a soft carpet of tiny overlapping tufts |
| `felce` (fern) | 5–7 fronds, each 0.55–0.85 long, arching; leaflets pinnate and tapering |
| `fungo` (mushroom) | cluster of 3: caps Ø 0.14–0.22, stems 0.16–0.28 |
| `succulenta` | rosette Ø 0.35, height 0.22, plump leaves |
| `carnivora` | 3 traps on stems, height 0.35–0.50, trap length 0.14 |

**Settlements** (relative to the ant, 0.20):

| Piece | Game size |
|---|---|
| `hut` (dome, 3 variants) | **Ø 0.40**, height 0.22, small arched door (0.10 × 0.12) |
| idol / clock tower / totem / antenna / banners | height **0.40–0.70** |
| market stall | 0.45 W × 0.30 H |
| campfire | base Ø 0.25, flame height 0.30 |

> **Sanity check to run in `sheet.html`:** put an ant next to the statuina — the figurine must be **≈ 2.7× taller** than the ant is long. Put the ant next to a hut — the hut must be ≈ **2× the ant's length** wide.

---

## 6. Models — art direction + specs

### Global style: "Toy-diorama, soft-natural"
- **Shape language:** rounded, slightly asymmetric, hand-made feel; gentle bevels on everything; no sharp mechanical edges. Think *Journey* / *Sky* / *Monument Valley* props.
- **Naturalistic anatomy, simplified:** count the right limbs (ant: 6 legs + 2 antennae; spider: 8; fly: 6 + 2 wings), but keep forms chunky and readable at 30 px.
- **Color script (linear → author in sRGB, convert):** low saturation bodies with **one warm accent** per model; leave the **glow areas** (`aEmit`) clearly separate so mutations can light them up.
- **Matte** surfaces (roughness .6–.85) except the beetle shell (glossy) and metal/glass details.
- **Imperfection:** tiny seeded variation per `seed` (a `build(THREE, {seed})` option) so 14 ants are not clones — but because creatures are **instanced**, return **one** geometry; variation comes from us (scale/tint). For objects/plants, `seed` may change the shape.
- **Mood:** friendly, quiet, a little uncanny. No faces with big cartoon eyes; ants have simple dark dot eyes; the fly may have red compound eyes.

### A. Creatures (instanced; 1 draw call each)
For each: **return one merged geometry**, forward = +X, feet on y = 0.
- `formiche`: 3 body segments (head, thorax, abdomen) with a clear waist, 6 jointed legs (2 segments, `aAnim.x=1`, alternating phase), elbowed antennae (`aAnim.x=2`), tiny mandibles. Dark chestnut body `#2B1D14`; **abdomen tip** `aEmit=1`.
- `termiti`: cream `#E6D6A8` soft segmented body (4 segments), brown head `#7A5A30`, short legs.
- `coleotteri`: domed glossy shell `#2F9A60` split by a line down the back, small dark head `#14281C`, 6 legs; shell rim slightly emissive-capable (`aEmit` 0.3).
- `ragni`: round abdomen `#3A2A35`, smaller cephalothorax `#241A22`, 8 legs with 2 visible joints each (spread, knees up), tiny eyes cluster. `aAnim.x=1` on legs with phase pattern.
- `lumache`: soft body `#C9B79C` with a gentle foot, two eye stalks (`aAnim.x=2`), spiral shell `#9A6A3C` with darker whorl `#6A4220` (a **real spiral**, not a torus glued on).
- `mosche`: dark body `#222A2E`, red eyes `#7A1A1A` (`aEmit` 0.4), two translucent-looking wings (`aAnim.x=3`, thin, light grey `#CFD8DC`), 6 hair-thin legs.

Optional per creature: `hero` geometry (≤ 1,400 tris, same pose, finer detail) and `armor` geometry (plates overlay for the *corazza* mutation).

### B. Objects (1–3 draw calls each; may use a 2nd/3rd material hint)
Charming, slightly worn **found objects**, colors desaturated and warm. The `candela` flame is a **separate small mesh** with `emissive` hint. The `specchio` glass disc is a separate mesh with a `metalness 1 / roughness 0.05` hint. The `statuina` is a small carved stone face-figure (blocky, two eye hollows, no mouth detail needed). The `giocattolo` is a worn teddy (stitches optional). The `radio` has a speaker grille, 2 knobs, a folding antenna.

### C. Plants (non-instanced; each returns an `update` function)
Plants are the **richness** of the jar — spend your budget here. Use `aSway` (0 base → 1 tip). `update(health, dry, t)`: `health` 0..1 scales size/droops fronds; `dry` 0..1 shifts colors toward brown `#8D7440`, curls leaf tips, lowers arching. **Colors are baked per vertex; `update` may rewrite the `color` attribute** (cheap, plants are few) or you may expose two color sets and lerp.

### D. Meteorite, jar, table, gravel, soil
- **Meteorite:** a dark lumpy stone (`#2A2434`), flat-ish, **faceted but organic**, with a **crack network** that glows violet. Provide `createCrackTexture(THREE)` returning a ≤512×256 `CanvasTexture` used as `emissiveMap`, and `setEnergy(e01, pulse01, flash01)` that sets `emissiveIntensity` and a point-light helper value. It must NOT look like a crystal or a wireframe.
- **Jar:** lathe profile (use exactly this profile, radius,y): `[[0,0],[.70,0],[.88,.05],[.97,.16],[1,.35],[1,1.18],[.97,1.32],[.86,1.42],[.80,1.47],[.80,1.56]]`; you may add a **glass thickness** (inner wall), a **thick base**, a **lip ring** and small **air bubbles / seam lines** for realism. Cork lid Ø 0.84→0.76, h 0.28, with a cork-grain canvas texture. Return `{ group, glass, cork, materials }`.
- **Table:** round oak disc R 3.6, with a procedural wood-grain canvas texture (≤512 px, tileable).
- **Gravel:** instanced pebbles (≈70) in 3 grey tones; **soil:** a cylinder whose thickness is driven by `setThickness(h)` with a speckled canvas texture; optional **crack decal** texture for dry soil.

### E. Settlement pieces
- `huts`: 3 variants (dome of pressed earth, a stack of pebbles, a hollowed-out seed husk). Merged geometry each, doorway visible, optional warm-window `aEmit` for night.
- `landmarks[culture](THREE,{stage})` for **10 cultures** (each reads as a distinct silhouette at 30 px):
  `sacro` (carved idol with a halo ring + two small flames) · `sapere` (clock tower with moving hand) · `commercio` (striped-awning stall + 2 coins) · `gioco` (bunting between two poles + a bouncing toy) · `mistero` (gilded mirror arch) · `comunicazione` (antenna with 3 expanding signal rings) · `fuoco` (campfire with logs, flame cones, light hook) · `agricoltura` (mushroom/fungus garden in rows) · `tribale` (stacked colored totem + 2 tents) · `guerra` (two pole banners, one spear rack).
  `stage` 0..3 grows the piece (more detail/size, extra ornaments, lit windows). Return `{ group, update(t) }`; animated sub-meshes (flame, rings, clock hand, flag) are **named children** and animated in `update`.

### F. Cat "Biscotto" (bonus, event hero)
A friendly ginger cat shown **partially**: a large curious **head peeking at the jar from behind it** and a **paw** pressed on the glass. Scale: head Ø ≈ 1.6 (it is far larger than the jar, it's a story moment). `{ group, update(t, mood) }` where `mood` ∈ `'curious' | 'sleepy' | 'mischief'` blinks eyes / flicks ears / moves tail tip. Soft toon-like fur shading via vertex colors.

---

## 7. API signatures & test harness

```js
// every build function
build(THREE, opts = {}) → result
```

| Group | `build()` returns |
|---|---|
| creature | `{ geometry, hero?, armor?, length, materialHint? }` — geometry in **final game scale** (no unit-length trick) |
| object | `{ group, size:{w,h,d}, materials? }` |
| plant | `{ group, update(health, dry, t) }` |
| meteorite | `{ mesh, crackTexture, setEnergy(e01, pulse01, flash01) }` |
| jar | `{ group, glass, cork, materials }` |
| hut | `{ geometry }` |
| landmark | `{ group, update(t), anchorHeight }` |
| cat | `{ group, update(t, mood) }` |

**Import map** the test page must use:

```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js" } }
</script>
<script type="module" src="./models.js"></script>
```

**`sheet.html` must include (this is how I will judge your work):**
1. A neutral studio scene with the **same light rig as the game** (Appendix A) and an **ACES-filmic** renderer.
2. **Turntable** for each model, labeled, with a toggle **wireframe / solid**.
3. A **10 cm reference cube** (1 unit) and a **jar silhouette ring** (radius 1.0) for scale. A row **"Scale check"** with ant + statuina + hut + jar edge side by side.
4. **Stats panel:** triangles, draw calls, geometry attributes present (`aAnim`, `aEmit`, `aSway`), per model, plus a **sum for the worst-case scene** (6 species × 14 + 3 objects + 3 plants + 2 settlements) vs. the 60,000-triangle budget.
5. An **instancing test**: render 14 instances of each creature with `InstancedMesh` + `setColorAt` (white) to prove no flipped normals.
6. Buttons **Day / Night** (lights change) and a slider **dry 0..1 / health 0..1** that drives the plants' `update`.
7. A **"mutation glow"** toggle that multiplies `aEmit` by a green color via `onBeforeCompile` (a small demo of how we will use it).

---

## 8. Acceptance checklist (I will test every line)

- [ ] All files run with a plain static server (`python3 -m http.server`) and **no console errors**.
- [ ] Every model within triangle and draw-call budget (README table is accurate).
- [ ] **Scale check** passes: ant:statuina ≈ 1 : 2.7, hut Ø ≈ 2× ant length, jar radius = 1.00.
- [ ] Origin at base center, forward +X (creatures) / +Z (objects), no negative scales.
- [ ] Creatures read as the right animal at **30 px** (screenshot at 360 px wide jar) *and* look good at **80 px** (close-up).
- [ ] Vertex colors present; `aAnim`, `aEmit` present on creatures; `aSway` on plants.
- [ ] Deterministic: same `seed` → identical geometry.
- [ ] Plants visibly **droop and yellow** as `dry` goes 0→1 and **shrink** as `health` goes 1→0.
- [ ] Meteorite looks like a **dark rock with glowing cracks**, not a crystal.
- [ ] No external assets, no `fetch`, no emoji sprites.

---

## 9. What to send back

Pass N: `models.js` (complete), `sheet.html` (complete), `README.md` (table + decisions + known issues), and **one paragraph** describing what you would improve next if given another pass.

---

## Appendix A — Current baseline in the game (so you know what to beat)

**Renderer / light rig (use the same in `sheet.html`):**
```js
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
camera = new THREE.PerspectiveCamera(36, aspect, .1, 60);
hemi  = new THREE.HemisphereLight(0xdbe8f5, 0x5a4636, 0.9);
sun   = new THREE.DirectionalLight(0xffd9a8, 2.2);  sun.position.set(2.5, 4, 3);
fill  = new THREE.DirectionalLight(0xbcd2ff, 0.6);  fill.position.set(-3, 2, 2);
// night: hemi 0.38, sun 0.45 (color 0x8fa6ff), fill 0.25
// scene.environment = PMREM of a vertical gradient equirect: #cfe3ff → #f2e6d2 → #4a382a
```

**Current merge helper and ant (basic — please be far better than this):**
```js
const SPH = new THREE.SphereGeometry(.5,12,9), CYL = new THREE.CylinderGeometry(.5,.5,1,6);
const MM = (x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,ord='XYZ') => new THREE.Matrix4().compose(
  new THREE.Vector3(x,y,z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,ord)), new THREE.Vector3(sx,sy,sz));
function mk(parts){ /* parts: [{g:Geometry, m:Matrix4, c:Color}] → merged BufferGeometry with position/normal/color/index */ }
formiche = () => { const c = new THREE.Color(0x2b1d14);
  return mk([{g:SPH,m:MM(-.3,.17,0,.46,.34,.34),c},{g:SPH,m:MM(-.02,.18,0,.28,.24,.24),c},{g:SPH,m:MM(.24,.19,0,.26,.24,.24),c}, /* + 6 straight cylinder legs */]); };
```
Problems to fix: spheres-on-spheres look, straight stick legs, no waist, no antennae elbows, no glow mask, wrong scale vs. objects.

**Jar profile** is in §6.D. **Camera defaults:** polar ≈ 1.2 rad, distance ≈ 3.8, target (0, .5, 0).

## Appendix B — Palette (sRGB)

| Role | Hex |
|---|---|
| Night sky | `#0B1030` → `#241A4E` |
| Day wood | `#7A5230` |
| Soil rich → poor | `#6B4A30` → `#8A8274` |
| Dry accent | `#8D7440` |
| Moss | `#3E8E68` |
| Fern | `#4E8A4A` |
| Meteorite rock | `#2A2434`, crack glow `#E4D6FF`, halo `#A07CFF` |
| UI accents (for glow tints) | green `#7CF5C8`, violet `#B49BFF`, amber `#FFC46B`, blue `#7CC4FF` |
| Mutation tints | radioactive `#AAFF80`, bioluminescent `#78E6FF`, poison `#C58CFF`, monster `#FF8C8C` |

*End of brief.*
