# TERRARIO — Full asset production order for Kimi

Version 1 · 24 October 2026 · replaces any earlier list. Follow brief v3 (`BRIEF.md`) for method, tiers, budgets, materials, animation and delivery format. Work autonomously, as in `PROMPT.md`.

## 0. Status of what you delivered

| id | Status | What to do |
|---|---|---|
| `formiche` | **ACCEPTED** (gate APPROVATO ×3, 8 clips, licence OK) | Next revision, not blocking: smoother leg silhouettes in hero/close, remove the small floating pieces near the thorax in swarm, less saturated colour (reddish-brown head/thorax, dark brown gaster). |
| `meteorite` | **FIX REQUIRED** | Your second zip was byte-identical to the first: the fixes below are still missing. |

**Meteorite fixes:**
1. Scale Ø **0.42** (you delivered 0.60).
2. No emissive texture or factor; the cracks as a **`_EMIT` vertex mask** (0 crust, 1 crack core) on all tiers, dark neutral crack albedo. We light them with the charge.
3. Metallic only on real exposed iron flecks, otherwise 0.
4. **Extra for the opening film:** a `hero` with a hot glowing variant is NOT needed: we animate heat and the fall in the engine.

## 1. Production order

Deliver one zip per pass, named `terrario-pass-<letter>.zip`. **Never resend files we already accepted** unless you changed them, and write in the report what changed.

### Pass A: creatures (tiers hero / close / swarm, rigid segmentation, `_ANIM` `_PIVOT` `_EMIT`, hero clips)
`meteorite` fix first (see above), then `termiti`, `coleotteri`, `ragni` (leg span **0.55**, check it), `lumache` (skinned), `mosche`. Subjects, sizes and poses: brief §7.

### Pass B: objects (close + swarm; hero for clock, teddy, candle)
`statuina`, `orologio`, `giocattolo`, `specchio`, `libro`, `moneta`, `radio`, `candela`. Moving parts: brief §5.4.
**Change for `statuina`:** the ants carve it in the player's image. Make it a small weathered stone head of a **child** (round cheeks, short hair, calm face), primitive carving, lichen spots. Same size (height 0.55).

### Pass C: plants
`felce` (morph `uncurl`), `fungo`, `succulenta`, `carnivora` (morph `trap_close`). `_SWAY` and `_GROW`.

### Pass D: settlements
`capanna` in **4 growth stages** (`capanna_1` … `capanna_4`: a few soil pellets → finished hut with thatch). Then the **ten landmarks**, one per culture, each a single object at ant scale (height 0.30–0.60), built from what ants can find in a jar: soil, twigs, seeds, leaves, pebbles, crumbs, threads. Close + swarm, no hero.

| id | Culture | Prompt subject |
|---|---|---|
| `landmark_sacro` | Theocracy (worships the player or the meteorite) | A tiny shrine of stacked pebbles and twigs around a small dark stone, offerings of seeds in a ring |
| `landmark_sapere` | Scientific society | A miniature observatory: a ring of upright twigs with a curved leaf dome and a seed-husk «telescope» pointing up |
| `landmark_commercio` | Mercantile society | A tiny market stall row made of leaf canopies on twig frames, piles of seeds and crumbs sorted by size |
| `landmark_gioco` | Festive society | A small arena of pebbles with flower-petal banners on thin twigs, a central «stage» of a flat stone |
| `landmark_mistero` | Esoteric society | A spiral of tiny white pebbles leading to a hollow seed pod, faint moss growing on it |
| `landmark_comunicazione` | Sky listeners | A tall thin mast of joined twigs with a dried-leaf «dish» facing up, threads like antennas |
| `landmark_fuoco` | Fire keepers | A small clay bowl on three pebbles, soot-darkened, with a ring of dry grass around it (no flame: we add it, material `fiamma` only if a flame is modelled) |
| `landmark_agricoltura` | Agricultural society | Tiny terraced plots of soil with rows of sprouting seeds and a twig fence |
| `landmark_guerra` | Militarist society | A palisade of sharpened twigs on a soil mound, with a watchtower of stacked pebbles |
| `landmark_tribale` | Tribal society | A circle of small mud huts around a totem made of a carved twig with a beetle shell on top |

### Pass E: Biscotto
`biscotto`: young tabby cat with white socks, skinned, ≤ 32 bones, morphs and clips as brief §5.5.

### Pass F: the room and the opening film (NEW)
The opening film and the game must be **fully 3D, no 2D illustrations anywhere**. These set pieces build the room and the five opening scenes: night sky from the window, the star falling in the garden, the empty jam jar, choosing where to put it, the stone beating. Same art direction: macro photography of a real child's room at night and by day. Same pipeline and gate. Set pieces have no swarm tier.

| id | Subject | Size (units, 1 = 10 cm) | Tiers | Notes |
|---|---|---|---|---|
| `barattolo` | Empty glass jam jar, straight sides, screw neck, metal lid with a little rust, faint paper-label glue marks | height 1.6, Ø 1.1 | close + hero | Glass as primitive `vetro` (thickness modelled, rounded rim), lid separate node `lid` with pivot on the thread for open/close |
| `scrivania` | Section of an old wooden desk top, oak with worn varnish, ink stains, small scratches, rounded front edge | 12 × 7, thickness 0.4 | close + hero | Tileable feel; the jar stands on it in every shot |
| `finestra` | Old painted wooden window with sill (`davanzale`), two panes, one slightly open, flaking white paint | 10 × 14 | close + hero | Panes as `vetro`; open pane on node `anta` with hinge pivot |
| `lampada` | Vintage metal desk lamp, flexible arm, warm bulb | height 6 | close + hero | Bulb glass as `vetro`; arm joints as nodes `arm_1`, `arm_2`, `head` with pivots; no light in the file |
| `quaderno` | Child's school notebook, worn cardboard cover, pencil notes on the edge, a pencil | 2.1 × 3.0 | close + hero | Cover on node `cover` hinged on the spine |
| `gelso` | Old mulberry tree at night, gnarled trunk, low branches, leaves | height 40 | hero only | Seen from the window and in the garden scene; `_SWAY` on leaves |
| `giardino` | Patch of garden ground behind the tree: grass, soil, fallen mulberry leaves, a small fresh crater with scorched edges | 20 × 20 | hero only | Crater centre at origin; the meteorite lands there |
| `mano` | A child's hand (about 8 years old), palm up, relaxed fingers, short clean nails | length 1.4 | close + hero | Skinned, 16 bones (wrist, 5 fingers × 3). Clips `open`, `hold` (cupping the stone), `tap` (index taps the glass). Neutral skin, no jewellery. It is the player's hand: used only in first-person close-ups. |

## 2. Rules that do not change
- Gate `APPROVATO` on every file, contact sheet in the golden scene, `meta.json` with the commercial licence.
- No baked lighting, organic = non-metal, no lights/cameras/environments in files.
- Rest poses, correct anatomy, real scale.
- Report in Italian, short, readable on a phone: table (id, triangles per tier, gate result), decisions you took, open questions only if you are truly blocked.

## 3. Order of delivery
1. `meteorite` fix (alone, small zip).
2. Pass F (`barattolo`, `scrivania`, `finestra`, `lampada`, `quaderno`, `mano`, then `gelso`, `giardino`): the opening film and the main scene depend on them.
3. Pass A, B, C, D, E.
