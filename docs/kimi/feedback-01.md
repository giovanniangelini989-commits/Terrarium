# Kimi delivery 01 — review (formiche, meteorite)

All six files print APPROVATO with tools/qa_gate.mjs. Commercial licence (Tripo) confirmed in meta.json. Thank you.

## formiche — ACCEPTED
Tiers, budgets, rigid segmentation, `_ANIM` / `_PIVOT` / `_EMIT` on swarm, 8 hero clips: all correct. Improve in the next revision (not blocking):
1. **Close-up quality is below the reference ant.** Legs read faceted and blocky in hero/close; the swarm tier shows small detached fragments near the thorax. Smooth the leg silhouettes and remove floating pieces.
2. **Colour too saturated.** The body reads orange-red. *Formica rufa* is reddish-brown on head and thorax with a dark brown gaster, natural and slightly desaturated (brief §1). Check that the albedo has no baked light.

## meteorite — FIX BEFORE INTEGRATION
1. **Scale:** `body_length` is 0.60; the brief asks Ø **0.42**. Re-run normalize with `--len 0.42`.
2. **The violet glow is baked into an emissive texture** (emissiveFactor 1, emissiveTexture present) and there is no `_EMIT` attribute. The game must light the cracks from zero to full with the meteorite's charge. Deliver:
   - no emissive texture or factor in the material;
   - the cracks as a `_EMIT` vertex mask (0 = crust, 1 = crack core), on all three tiers;
   - a neutral dark crack colour in the albedo (we add the violet `#A88BFF`).
3. Stone-iron: metallic only where iron is really exposed (small flecks), otherwise 0.

## Next
Continue exactly as in the prompt: pass A (termiti, coleotteri, ragni, lumache, mosche), then B, C (with the fixed meteorite), D, E. One package per pass, gate APPROVATO on every file.
