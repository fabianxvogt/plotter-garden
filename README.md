# Plotter Garden

Plotter Garden is a local-first browser tool for growing attractive pen drawings that stay inside real paper margins. It is for artists, makers, and plotter-curious people who want a distinctive vector result they can save, reopen, inspect, and export.

Status: building / v1 implementation. The browser generator is genuine and bounded; no hardware control or physical test plots have been performed, so this project makes no plotter-readiness claim.

## Quick start

```sh
npm install
npm run dev
```

Choose Herbarium, Orbitals, or Lattice bloom, tune the seed and growth, select paper, click paths to inspect or remove details, save a recipe, and export a layered SVG. The work stays in the browser. JSON recipes are versioned (`version: 1`) and can be reopened locally or imported after download.

## Evidence and limits

- `lib/plotter.ts` contains deterministic generators, exact mm paper sizes, margin clamping, SVG serialization, and a bounded nearest-neighbour travel heuristic.
- `tests/plotter-fixtures.ts` checks path bounds for every generator, 25.4 mm/in conversion, segment preservation, and honest non-guarantee metadata.
- Optimization reorders whole strokes and never rewrites `d` geometry. It is useful but not guaranteed globally shortest.
- Physical paper checks have not been performed. Do not describe the output as plotter-ready until three independent test plots pass.

License: MIT for original source. The app uses no external art assets or network processing.
