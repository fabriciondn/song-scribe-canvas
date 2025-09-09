export type Placement = { charIndex: number; symbol: string };
export type PlacementLine = { text: string; chords: Placement[] };
export type Placements = { lines: PlacementLine[] };