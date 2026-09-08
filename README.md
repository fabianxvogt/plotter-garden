<!-- portfolio
{
  "title": "Plotter Garden",
  "topic": "Creative tools/Generative art",
  "type": "product",
  "description": "Local-first generative pen drawings with bounded SVG export",
  "demo": "https://plotter-garden.fabian523417.chatgpt.site"
}
-->

# Plotter Garden

Plotter Garden is a local-first browser tool for growing attractive pen drawings that stay inside real paper margins. It is for artists, makers, and plotter-curious people who want a distinctive vector result they can save, reopen, inspect, and export.

Status: building / v1 implementation. The ordinary source is public at [fabianxvogt/plotter-garden](https://github.com/fabianxvogt/plotter-garden). The accepted product/release source is commit `706addc713c8d2042dacaf13f33821629af70649`; later documentation commits do not change that product source. The browser generator is genuine and bounded; no hardware control or physical test plots have been performed, so this project makes no plotter-readiness claim.

The Site app is publicly deployed as a preview at https://plotter-garden.fabian523417.chatgpt.site from saved Site version `1`. The bounded browser journey was reviewed, but full-v1 remains open: native file chooser/import, other-device and sustained-performance checks, human acceptance, and physical paper plots remain unverified.

## Quick start

```sh
npm install
npm run dev
```

Choose Herbarium, Orbitals, or Lattice bloom, tune the seed and growth, select paper, click paths to inspect or remove details, save a recipe, and export a layered SVG. The work stays in the browser. JSON recipes are versioned (`version: 1`) and can be reopened locally or imported after download.

## Public preview evidence

A fresh isolated public-preview run measured CSS `window.innerWidth=390`, `window.innerHeight=844`, and `devicePixelRatio=1`; the SVG preview rendered without an HTML canvas. The settled page showed the Herbarium drawing and the advertised seed, growth, paper, Save, Reopen, Export SVG, and optimization controls.

The observed workflow changed seed `1482` to `1499`, changing the recipe name and travel metrics; Save reported a local save; reload followed by the explicit Reopen control restored seed `1499` and the `garden-herbarium-1499` drawing. Fresh SVG export produced a 17,954-byte file with `210mm × 297mm` dimensions and `viewBox="0 0 210 297"`. No page or console errors were observed.

## Evidence and limits

- `lib/plotter.ts` contains deterministic generators, exact mm paper sizes, a shared bounded config/recipe schema, SVG serialization, and a bounded nearest-neighbour travel heuristic.
- `tests/plotter-fixtures.ts` checks path bounds for every generator, 25.4 mm/in conversion, segment preservation, adversarial recipe rejection, same-set removed-path optimization, all four pen layers, and the seed-1482 non-increase guarantee.
- Imports reject oversized or malformed recipes before generation; stale asynchronous imports are ignored, and downloads keep their object URL alive briefly before cleanup.
- A real import controller invalidates pending reads before local edits, path removal, undo, or reopen; accepted current imports still apply. The preview labels when the original stroke order is retained.
- Optimization reorders whole strokes and never rewrites `d` geometry. It is useful but not guaranteed globally shortest.
- Physical paper checks have not been performed. Do not describe the output as plotter-ready until three independent test plots pass.

License: MIT for original source. The app uses no external art assets or network processing.
