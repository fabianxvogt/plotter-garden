# Roadmap

State: building

## Public source and release state

- Ordinary source: [fabianxvogt/plotter-garden](https://github.com/fabianxvogt/plotter-garden).
- Accepted product/release source: `706addc713c8d2042dacaf13f33821629af70649`.
- Public Site preview: https://plotter-garden.fabian523417.chatgpt.site (saved Site version `1`).
- The bounded browser journey passed review. Full-v1 gates remain open for native file chooser/import, other-device and sustained-performance checks, human acceptance, and physical paper plots.

## Now

- [x] Three genuinely distinct deterministic generators.
- [x] Seed, growth, paper, safe-margin, pen-weight, and layer controls.
- [x] Margin-safe SVG preview with clickable path inspection.
- [x] Remove selected detail and undo recovery.
- [x] Measured before/after bounded travel ordering that preserves path geometry.
- [x] Local save/reopen and versioned recipe JSON import/export with size/error handling.
- [x] Scaled layered SVG export with mm units and exact viewBox.
- [x] Independent math fixtures and clean build/lint checks.
- [x] Full bounded recipe schema and generation safety caps for seed, growth, margins, layers, and stroke width.
- [x] Same-visible-path travel comparison; worse heuristic candidates keep the original order.
- [x] Deferred download cleanup and stale-import race protection.
- [x] All four pen layers are populated by each generator when selected.
- [x] Local edit intent invalidates pending imports without cancelling accepted completions; original-retained ordering is labeled truthfully.
- [x] Bounded browser journey review, save/reopen, fresh SVG/recipe export, and narrow-layout checks completed for the accepted release.
- [x] Public Site preview deployed from saved version `1`; this does not claim full-v1 acceptance.
- [x] Fresh isolated public-preview check measured CSS `390×844` at `devicePixelRatio=1`, with the SVG preview rendered and no page or console errors observed.
- [x] Public preview workflow observed: seed edit, local Save, reload, explicit Reopen restoration, and fresh SVG export with `210mm × 297mm` units.

## Next

- [ ] Complete remaining full-v1 gates: native file chooser/import, other-device and sustained-performance checks, and human acceptance.
- [ ] Validate three real paper plots on supported hardware before any plotter-readiness claim.

## Later

- [ ] Add optional user-defined pen palette after validating export compatibility.
- [ ] Add a plotter-specific test fixture suite once hardware is authorized.

## Done

- [x] Repository initialized inside target on `codex/v1`.
