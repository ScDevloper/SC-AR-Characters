/**
 * One entry per character. `body` picks the 3D archetype, so two characters
 * only look alike if they deliberately share a body.
 */

export type BodyKind =
  | "humanoid"
  | "rover"
  | "drone"
  | "roll"
  | "stack"
  | "arm"
  | "quad"
  | "tube"
  | "crawler"
  | "drop"
  | "swarm"
  | "press"
  | "kiosk"
  | "orb"
  | "gantry"
  | "truck"
  | "pallet"
  | "forklift"
  | "cutter"
  | "mixer"
  | "glueline"
  | "stamper"
  | "platesetter"
  | "rack"
  | "vault"
  | "trolley"
  | "dancer";

export type CharacterConfig = {
  name: string;
  shortName: string;
  role: string;
  code: string;
  /** Short numeric id used in QR links (?m=7). Never renumber a printed one. */
  num: number;
  accent: number;
  secondary: number;
  dance: string;
  body: BodyKind;
};

export const CHARACTERS = {
  laminate: {
    name: "LamiBot",
    shortName: "Laminate",
    role: "Lamination specialist",
    code: "LAMI-03",
    num: 3,
    accent: 0x2ee6a6,
    secondary: 0x55a7ff,
    dance: "Film-flow disco",
    body: "gantry",
  },
  quality: {
    name: "Q-Bot",
    shortName: "Quality",
    role: "Quality inspection scanner",
    code: "QC-04",
    num: 4,
    accent: 0xa879ff,
    secondary: 0x19d9ff,
    dance: "Scanner swing",
    body: "orb",
  },
  paper: {
    name: "Rollie",
    shortName: "Paper",
    role: "Paper-roll handling unit",
    code: "ROLL-08",
    num: 8,
    accent: 0xe8f4ff,
    secondary: 0x4c8dff,
    dance: "Roll and rock",
    body: "forklift",
  },
  maintenance: {
    name: "Gearo",
    shortName: "Maintenance",
    role: "Maintenance and uptime crew",
    code: "FIX-12",
    num: 12,
    accent: 0xff6b35,
    secondary: 0x38bdf8,
    dance: "Spanner shuffle",
    body: "humanoid",
  },

  courier: {
    name: "Trolley",
    shortName: "Courier",
    role: "Tracked floor courier",
    code: "CART-13",
    num: 13,
    accent: 0x5eead4,
    secondary: 0xfacc15,
    dance: "Tread two-step",
    body: "rover",
  },
  inspector: {
    name: "Skye",
    shortName: "Inspector",
    role: "Airborne press inspector",
    code: "SKY-14",
    num: 14,
    accent: 0x60a5fa,
    secondary: 0xf472b6,
    dance: "Hover figure-eight",
    body: "drone",
  },
  plotter: {
    name: "Skitter",
    shortName: "Plotter",
    role: "Four-legged proofing plotter",
    code: "PLOT-18",
    num: 18,
    accent: 0xc084fc,
    secondary: 0x4ade80,
    dance: "Wave walk",
    body: "quad",
  },

  halftone: {
    name: "Dots",
    shortName: "Halftone",
    role: "Halftone dot swarm",
    code: "DOT-22",
    num: 22,
    accent: 0x06b6d4,
    secondary: 0xf43f5e,
    dance: "Scatter and reform",
    body: "swarm",
  },
} as const satisfies Record<string, CharacterConfig>;

export type CharacterId = keyof typeof CHARACTERS;

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];

/** Numeric id -> character, for the short `?m=` links printed on QR codes. */
export const CHARACTER_BY_NUMBER: Record<number, CharacterId> = Object.fromEntries(
  CHARACTER_IDS.map((id) => [CHARACTERS[id].num, id]),
) as Record<number, CharacterId>;

export function characterFromNumber(value: string | number | null | undefined): CharacterId | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num)) return null;
  return CHARACTER_BY_NUMBER[num] ?? null;
}

export function isCharacterId(value: string | null | undefined): value is CharacterId {
  return Boolean(value && value in CHARACTERS);
}

/** `0x19d9ff` -> `#19d9ff`, for CSS and SVG. */
export function hex(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}
