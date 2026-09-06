export type GeneratorKind = 'herbarium' | 'orbits' | 'lattice';
export type PaperKind = 'A4' | 'A3' | 'Letter';
export type Point = { x: number; y: number };
export type PaperSpec = { width: number; height: number };
export type Margins = { top: number; right: number; bottom: number; left: number };
export type GardenConfig = { generator: GeneratorKind; seed: number; growth: number; paper: PaperKind; margins: Margins; penLayers: number; strokeWidth: number };
export type GardenPath = { id: string; layer: number; color: string; d: string; points: Point[]; start: Point; end: Point };
export type GardenRecipe = { version: 1; kind: 'plotter-garden-recipe'; savedAt?: string; config: GardenConfig; removedIds: string[] };

export const PAPER_SPECS: Record<PaperKind, PaperSpec> = { A4: { width: 210, height: 297 }, A3: { width: 297, height: 420 }, Letter: { width: 215.9, height: 279.4 } };
export const PEN_COLORS = ['#1a2e29', '#b44c32', '#d49a35', '#597f72'];
export function inchesToMm(inches: number): number { return inches * 25.4; }
export function paperSize(paper: PaperKind): PaperSpec { return PAPER_SPECS[paper]; }
export function hashSeed(seed: number): number { let h = Math.floor(seed) | 0; h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
function rng(seed: number) { let value = hashSeed(seed) || 1; return () => { value += 0x6d2b79f5; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function safePoint(point: Point, bounds: { left: number; top: number; right: number; bottom: number }): Point { return { x: Number(clamp(point.x, bounds.left, bounds.right).toFixed(3)), y: Number(clamp(point.y, bounds.top, bounds.bottom).toFixed(3)) }; }
function pathFromPoints(points: Point[]): string { return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' '); }
function addPath(paths: GardenPath[], id: string, layer: number, points: Point[], bounds: { left: number; top: number; right: number; bottom: number }) { const safe = points.map((point) => safePoint(point, bounds)); if (safe.length < 2) return; paths.push({ id, layer, color: PEN_COLORS[layer % PEN_COLORS.length], d: pathFromPoints(safe), points: safe, start: safe[0], end: safe[safe.length - 1] }); }
function petalPoints(center: Point, radiusX: number, radiusY: number, rotation: number, segments = 18): Point[] { return Array.from({ length: segments + 1 }, (_, index) => { const angle = (index / segments) * Math.PI * 2; const x = Math.cos(angle) * radiusX; const y = Math.sin(angle) * radiusY; return { x: center.x + x * Math.cos(rotation) - y * Math.sin(rotation), y: center.y + x * Math.sin(rotation) + y * Math.cos(rotation) }; }); }

function herbarium(config: GardenConfig, bounds: { left: number; top: number; right: number; bottom: number }): GardenPath[] {
  const random = rng(config.seed); const paths: GardenPath[] = []; const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top; const stems = 4 + Math.round(config.growth / 11);
  for (let stemIndex = 0; stemIndex < stems; stemIndex += 1) { const x = bounds.left + width * (0.08 + (stemIndex / Math.max(1, stems - 1)) * 0.84) + (random() - 0.5) * width * 0.06; const baseY = bounds.bottom - height * (0.04 + random() * 0.08); const topY = bounds.top + height * (0.16 + random() * 0.3); const sway = (random() - 0.5) * width * 0.12; addPath(paths, `stem-${stemIndex}`, 0, [{ x, y: baseY }, { x: x + sway * 0.28, y: baseY - height * 0.27 }, { x: x + sway * 0.78, y: topY + height * 0.16 }, { x: x + sway, y: topY }], bounds); const leaves = 2 + Math.round(config.growth / 22); for (let leafIndex = 0; leafIndex < leaves; leafIndex += 1) { const t = 0.25 + (leafIndex / Math.max(1, leaves - 1)) * 0.62; const center = { x: x + sway * t, y: baseY + (topY - baseY) * t }; const side = leafIndex % 2 === 0 ? -1 : 1; addPath(paths, `leaf-${stemIndex}-${leafIndex}`, 1, petalPoints(center, width * (0.035 + random() * 0.018), height * (0.07 + random() * 0.025), side * 0.6, 12), bounds); addPath(paths, `vein-${stemIndex}-${leafIndex}`, 2, [center, { x: center.x + side * width * 0.025, y: center.y - height * 0.055 }], bounds); } addPath(paths, `crown-${stemIndex}`, 1, petalPoints({ x: x + sway, y: topY }, width * 0.042, height * 0.055, 0, 14), bounds); }
  return paths;
}

function orbits(config: GardenConfig, bounds: { left: number; top: number; right: number; bottom: number }): GardenPath[] {
  const random = rng(config.seed); const paths: GardenPath[] = []; const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top; const center = { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 }; const rings = 5 + Math.round(config.growth / 14);
  for (let ring = 0; ring < rings; ring += 1) { const t = (ring + 1) / (rings + 1); const rotation = random() * Math.PI; addPath(paths, `orbit-${ring}`, ring % Math.max(1, config.penLayers), petalPoints(center, width * (0.08 + t * 0.34), height * (0.06 + t * 0.36), rotation, 32), bounds); const satellites = 2 + Math.round(config.growth / 25); for (let satellite = 0; satellite < satellites; satellite += 1) { const angle = rotation + (satellite / satellites) * Math.PI * 2 + random() * 0.2; const node = { x: center.x + Math.cos(angle) * width * (0.08 + t * 0.32), y: center.y + Math.sin(angle) * height * (0.06 + t * 0.34) }; addPath(paths, `ray-${ring}-${satellite}`, 1 % Math.max(1, config.penLayers), [center, node], bounds); addPath(paths, `node-${ring}-${satellite}`, 2 % Math.max(1, config.penLayers), petalPoints(node, width * 0.018, height * 0.018, angle, 10), bounds); } }
  return paths;
}

function lattice(config: GardenConfig, bounds: { left: number; top: number; right: number; bottom: number }): GardenPath[] {
  const random = rng(config.seed); const paths: GardenPath[] = []; const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top; const columns = 3 + Math.round(config.growth / 18); const rows = Math.max(3, Math.round(columns * 1.15)); const gapX = width / (columns + 1); const gapY = height / (rows + 1);
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) { const center = { x: bounds.left + gapX * (column + 1), y: bounds.top + gapY * (row + 1) }; const radius = Math.min(gapX, gapY) * (0.33 + random() * 0.1); addPath(paths, `rosette-${row}-${column}`, (row + column) % Math.max(1, config.penLayers), petalPoints(center, radius, radius * (0.55 + random() * 0.18), random() * Math.PI, 20), bounds); if (column < columns - 1) addPath(paths, `weave-h-${row}-${column}`, 1 % Math.max(1, config.penLayers), [center, { x: center.x + gapX, y: center.y + (random() - 0.5) * gapY * 0.28 }], bounds); if (row < rows - 1) addPath(paths, `weave-v-${row}-${column}`, 2 % Math.max(1, config.penLayers), [center, { x: center.x + (random() - 0.5) * gapX * 0.28, y: center.y + gapY }], bounds); }
  return paths;
}

export function generateGarden(config: GardenConfig): { paper: PaperSpec; bounds: { left: number; top: number; right: number; bottom: number }; paths: GardenPath[] } { const paper = paperSize(config.paper); const bounds = { left: config.margins.left, top: config.margins.top, right: paper.width - config.margins.right, bottom: paper.height - config.margins.bottom }; const paths = config.generator === 'herbarium' ? herbarium(config, bounds) : config.generator === 'orbits' ? orbits(config, bounds) : lattice(config, bounds); return { paper, bounds, paths }; }
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function travelDistance(paths: GardenPath[]): number { return paths.slice(1).reduce((sum, path, index) => sum + distance(paths[index].end, path.start), 0); }
/** Bounded nearest-neighbour ordering. Whole path geometry is never edited. */
export function optimizeTravel(paths: GardenPath[]): GardenPath[] { if (paths.length < 3) return [...paths]; const remaining = [...paths]; const ordered = [remaining.shift() as GardenPath]; while (remaining.length) { const current = ordered[ordered.length - 1].end; let bestIndex = 0; let bestDistance = Number.POSITIVE_INFINITY; remaining.forEach((candidate, index) => { const candidateDistance = distance(current, candidate.start); if (candidateDistance < bestDistance) { bestDistance = candidateDistance; bestIndex = index; } }); ordered.push(remaining.splice(bestIndex, 1)[0]); } return ordered; }
function escapeXml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character); }
export function gardenSvg(config: GardenConfig, paths: GardenPath[]): string { const paper = paperSize(config.paper); const grouped = new Map<number, GardenPath[]>(); paths.forEach((path) => grouped.set(path.layer, [...(grouped.get(path.layer) ?? []), path])); const layers = [...grouped.entries()].sort(([a], [b]) => a - b).map(([layer, layerPaths]) => `<g id="pen-layer-${layer + 1}" data-pen-layer="${layer + 1}" fill="none" stroke="${PEN_COLORS[layer % PEN_COLORS.length]}" stroke-width="${config.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${layerPaths.map((path) => `<path id="${escapeXml(path.id)}" d="${path.d}"/>`).join('')}</g>`).join(''); return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}"><title>Plotter Garden · ${config.generator}</title>${layers}</svg>`; }
export function countPoints(paths: GardenPath[]): number { return paths.reduce((sum, path) => sum + path.points.length, 0); }
export function parseRecipe(text: string): GardenRecipe | null {
  try {
    const candidate = JSON.parse(text) as Partial<GardenRecipe>;
    const config = candidate.config;
    if (candidate.version !== 1 || candidate.kind !== 'plotter-garden-recipe' || !config || !['herbarium', 'orbits', 'lattice'].includes(config.generator) || !Object.prototype.hasOwnProperty.call(PAPER_SPECS, config.paper) || !Number.isFinite(config.seed) || !Number.isFinite(config.growth) || !config.margins) return null;
    return { version: 1, kind: 'plotter-garden-recipe', savedAt: candidate.savedAt, config: config as GardenConfig, removedIds: Array.isArray(candidate.removedIds) ? candidate.removedIds.filter((id): id is string => typeof id === 'string') : [] };
  } catch {
    return null;
  }
}
