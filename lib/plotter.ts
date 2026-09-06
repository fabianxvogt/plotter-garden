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
export const MAX_RECIPE_BYTES = 512 * 1024;
export const CONFIG_LIMITS = { seed: [0, 999999], growth: [10, 94], margin: [8, 35], penLayers: [1, 4], strokeWidth: [0.18, 0.9] } as const;
export const DEFAULT_GARDEN_CONFIG: GardenConfig = { generator: 'herbarium', seed: 1482, growth: 58, paper: 'A4', margins: { top: 18, right: 16, bottom: 18, left: 16 }, penLayers: 3, strokeWidth: 0.42 };
export function inchesToMm(inches: number): number { return inches * 25.4; }
export function paperSize(paper: PaperKind): PaperSpec { return PAPER_SPECS[paper]; }
export function hashSeed(seed: number): number { let h = Math.floor(seed) | 0; h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
function rng(seed: number) { let value = hashSeed(seed) || 1; return () => { value += 0x6d2b79f5; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function boundedInteger(value: number, range: readonly [number, number]): number { return Math.round(clamp(value, range[0], range[1])); }
function boundedNumber(value: number, range: readonly [number, number]): number { return Number(clamp(value, range[0], range[1]).toFixed(3)); }
export function normalizeConfig(value: unknown): GardenConfig | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const generator = candidate.generator;
  const paper = candidate.paper;
  const seed = candidate.seed;
  const growth = candidate.growth;
  const penLayers = candidate.penLayers;
  const strokeWidth = candidate.strokeWidth;
  const margins = candidate.margins;
  if (typeof generator !== 'string' || !['herbarium', 'orbits', 'lattice'].includes(generator) || typeof paper !== 'string' || !Object.prototype.hasOwnProperty.call(PAPER_SPECS, paper) || typeof seed !== 'number' || !Number.isInteger(seed) || seed < CONFIG_LIMITS.seed[0] || seed > CONFIG_LIMITS.seed[1] || typeof growth !== 'number' || !Number.isInteger(growth) || growth < CONFIG_LIMITS.growth[0] || growth > CONFIG_LIMITS.growth[1] || typeof penLayers !== 'number' || !Number.isInteger(penLayers) || penLayers < CONFIG_LIMITS.penLayers[0] || penLayers > CONFIG_LIMITS.penLayers[1] || typeof strokeWidth !== 'number' || !Number.isFinite(strokeWidth) || strokeWidth < CONFIG_LIMITS.strokeWidth[0] || strokeWidth > CONFIG_LIMITS.strokeWidth[1] || !margins || typeof margins !== 'object') return null;
  const marginRecord = margins as Record<string, unknown>;
  const marginValues = [marginRecord.top, marginRecord.right, marginRecord.bottom, marginRecord.left];
  if (marginValues.some((margin) => typeof margin !== 'number' || !Number.isInteger(margin) || margin < CONFIG_LIMITS.margin[0] || margin > CONFIG_LIMITS.margin[1])) return null;
  return { generator: generator as GeneratorKind, seed, growth, paper: paper as PaperKind, margins: { top: marginRecord.top as number, right: marginRecord.right as number, bottom: marginRecord.bottom as number, left: marginRecord.left as number }, penLayers, strokeWidth };
}
export function boundedConfig(config: GardenConfig): GardenConfig { const safe = normalizeConfig(config); if (safe) return safe; return { generator: ['herbarium', 'orbits', 'lattice'].includes(config.generator) ? config.generator : DEFAULT_GARDEN_CONFIG.generator, seed: boundedInteger(Number.isFinite(config.seed) ? config.seed : DEFAULT_GARDEN_CONFIG.seed, CONFIG_LIMITS.seed), growth: boundedInteger(Number.isFinite(config.growth) ? config.growth : DEFAULT_GARDEN_CONFIG.growth, CONFIG_LIMITS.growth), paper: Object.prototype.hasOwnProperty.call(PAPER_SPECS, config.paper) ? config.paper : DEFAULT_GARDEN_CONFIG.paper, margins: { top: boundedInteger(Number.isFinite(config.margins?.top) ? config.margins.top : DEFAULT_GARDEN_CONFIG.margins.top, CONFIG_LIMITS.margin), right: boundedInteger(Number.isFinite(config.margins?.right) ? config.margins.right : DEFAULT_GARDEN_CONFIG.margins.right, CONFIG_LIMITS.margin), bottom: boundedInteger(Number.isFinite(config.margins?.bottom) ? config.margins.bottom : DEFAULT_GARDEN_CONFIG.margins.bottom, CONFIG_LIMITS.margin), left: boundedInteger(Number.isFinite(config.margins?.left) ? config.margins.left : DEFAULT_GARDEN_CONFIG.margins.left, CONFIG_LIMITS.margin) }, penLayers: boundedInteger(Number.isFinite(config.penLayers) ? config.penLayers : DEFAULT_GARDEN_CONFIG.penLayers, CONFIG_LIMITS.penLayers), strokeWidth: boundedNumber(Number.isFinite(config.strokeWidth) ? config.strokeWidth : DEFAULT_GARDEN_CONFIG.strokeWidth, CONFIG_LIMITS.strokeWidth) }; }
function safePoint(point: Point, bounds: { left: number; top: number; right: number; bottom: number }): Point { return { x: Number(clamp(point.x, bounds.left, bounds.right).toFixed(3)), y: Number(clamp(point.y, bounds.top, bounds.bottom).toFixed(3)) }; }
function pathFromPoints(points: Point[]): string { return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' '); }
function addPath(paths: GardenPath[], id: string, layer: number, points: Point[], bounds: { left: number; top: number; right: number; bottom: number }) { const safe = points.map((point) => safePoint(point, bounds)); if (safe.length < 2) return; paths.push({ id, layer, color: PEN_COLORS[layer % PEN_COLORS.length], d: pathFromPoints(safe), points: safe, start: safe[0], end: safe[safe.length - 1] }); }
function petalPoints(center: Point, radiusX: number, radiusY: number, rotation: number, segments = 18): Point[] { return Array.from({ length: segments + 1 }, (_, index) => { const angle = (index / segments) * Math.PI * 2; const x = Math.cos(angle) * radiusX; const y = Math.sin(angle) * radiusY; return { x: center.x + x * Math.cos(rotation) - y * Math.sin(rotation), y: center.y + x * Math.sin(rotation) + y * Math.cos(rotation) }; }); }

function herbarium(config: GardenConfig, bounds: { left: number; top: number; right: number; bottom: number }): GardenPath[] {
  const random = rng(config.seed); const paths: GardenPath[] = []; const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top; const stems = 4 + Math.round(config.growth / 11);
  for (let stemIndex = 0; stemIndex < stems; stemIndex += 1) { const x = bounds.left + width * (0.08 + (stemIndex / Math.max(1, stems - 1)) * 0.84) + (random() - 0.5) * width * 0.06; const baseY = bounds.bottom - height * (0.04 + random() * 0.08); const topY = bounds.top + height * (0.16 + random() * 0.3); const sway = (random() - 0.5) * width * 0.12; addPath(paths, `stem-${stemIndex}`, 0, [{ x, y: baseY }, { x: x + sway * 0.28, y: baseY - height * 0.27 }, { x: x + sway * 0.78, y: topY + height * 0.16 }, { x: x + sway, y: topY }], bounds); const leaves = 2 + Math.round(config.growth / 22); for (let leafIndex = 0; leafIndex < leaves; leafIndex += 1) { const t = 0.25 + (leafIndex / Math.max(1, leaves - 1)) * 0.62; const center = { x: x + sway * t, y: baseY + (topY - baseY) * t }; const side = leafIndex % 2 === 0 ? -1 : 1; addPath(paths, `leaf-${stemIndex}-${leafIndex}`, 1, petalPoints(center, width * (0.035 + random() * 0.018), height * (0.07 + random() * 0.025), side * 0.6, 12), bounds); addPath(paths, `vein-${stemIndex}-${leafIndex}`, 2, [center, { x: center.x + side * width * 0.025, y: center.y - height * 0.055 }], bounds); } addPath(paths, `crown-${stemIndex}`, 3 % Math.max(1, config.penLayers), petalPoints({ x: x + sway, y: topY }, width * 0.042, height * 0.055, 0, 14), bounds); }
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

export function generateGarden(config: GardenConfig): { paper: PaperSpec; bounds: { left: number; top: number; right: number; bottom: number }; paths: GardenPath[] } { const safeConfig = boundedConfig(config); const paper = paperSize(safeConfig.paper); const bounds = { left: safeConfig.margins.left, top: safeConfig.margins.top, right: paper.width - safeConfig.margins.right, bottom: paper.height - safeConfig.margins.bottom }; const paths = safeConfig.generator === 'herbarium' ? herbarium(safeConfig, bounds) : safeConfig.generator === 'orbits' ? orbits(safeConfig, bounds) : lattice(safeConfig, bounds); return { paper, bounds, paths }; }
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function travelDistance(paths: GardenPath[]): number { return paths.slice(1).reduce((sum, path, index) => sum + distance(paths[index].end, path.start), 0); }
/** Bounded nearest-neighbour ordering. Whole path geometry is never edited. */
export function optimizeTravel(paths: GardenPath[]): GardenPath[] { if (paths.length < 3) return [...paths]; const remaining = [...paths]; const ordered = [remaining.shift() as GardenPath]; while (remaining.length) { const current = ordered[ordered.length - 1].end; let bestIndex = 0; let bestDistance = Number.POSITIVE_INFINITY; remaining.forEach((candidate, index) => { const candidateDistance = distance(current, candidate.start); if (candidateDistance < bestDistance) { bestDistance = candidateDistance; bestIndex = index; } }); ordered.push(remaining.splice(bestIndex, 1)[0]); } return travelDistance(ordered) <= travelDistance(paths) ? ordered : [...paths]; }
function escapeXml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character); }
export function gardenSvg(config: GardenConfig, paths: GardenPath[]): string { const paper = paperSize(config.paper); const grouped = new Map<number, GardenPath[]>(); paths.forEach((path) => grouped.set(path.layer, [...(grouped.get(path.layer) ?? []), path])); const layers = [...grouped.entries()].sort(([a], [b]) => a - b).map(([layer, layerPaths]) => `<g id="pen-layer-${layer + 1}" data-pen-layer="${layer + 1}" fill="none" stroke="${PEN_COLORS[layer % PEN_COLORS.length]}" stroke-width="${config.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${layerPaths.map((path) => `<path id="${escapeXml(path.id)}" d="${path.d}"/>`).join('')}</g>`).join(''); return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}"><title>Plotter Garden · ${config.generator}</title>${layers}</svg>`; }
export function countPoints(paths: GardenPath[]): number { return paths.reduce((sum, path) => sum + path.points.length, 0); }
export function parseRecipe(text: string): GardenRecipe | null {
  try {
    if (new TextEncoder().encode(text).byteLength > MAX_RECIPE_BYTES) return null;
    const candidate = JSON.parse(text) as Partial<GardenRecipe>;
    const config = normalizeConfig(candidate.config);
    if (candidate.version !== 1 || candidate.kind !== 'plotter-garden-recipe' || !config || !Array.isArray(candidate.removedIds) || candidate.removedIds.length > 10000 || candidate.removedIds.some((id) => typeof id !== 'string' || id.length > 128)) return null;
    return { version: 1, kind: 'plotter-garden-recipe', savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : undefined, config, removedIds: candidate.removedIds };
  } catch {
    return null;
  }
}
export function isLatestImport(requestId: number, latestRequestId: number): boolean { return requestId === latestRequestId; }
export function createImportController() { let latestRequestId = 0; let cancelActive: (() => void) | null = null; return { begin(cancel: () => void): number { cancelActive?.(); latestRequestId += 1; cancelActive = cancel; return latestRequestId; }, invalidate(): void { latestRequestId += 1; cancelActive?.(); cancelActive = null; }, finish(requestId: number): boolean { if (!isLatestImport(requestId, latestRequestId)) return false; cancelActive = null; return true; } }; }
