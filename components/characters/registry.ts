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
  /* --- original humanoid line-up ------------------------------------ */
  press: {
    name: "PressBot",
    shortName: "Press",
    role: "Printing press operator",
    code: "PRESS-01",
    num: 1,
    accent: 0x19d9ff,
    secondary: 0xff2e8c,
    dance: "Roller groove",
    body: "press",
  },
  diecut: {
    name: "CutBot",
    shortName: "Die-cut",
    role: "Precision die-cutting unit",
    code: "CUT-02",
    num: 2,
    accent: 0xff8a1f,
    secondary: 0xffd84a,
    dance: "Cutter twist",
    body: "cutter",
  },
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
  carton: {
    name: "PackBot",
    shortName: "Carton",
    role: "Carton forming assistant",
    code: "PACK-05",
    num: 5,
    accent: 0xffd84a,
    secondary: 0xff6a3d,
    dance: "Boxy bounce",
    body: "pallet",
  },
  dispatch: {
    name: "DashBot",
    shortName: "Dispatch",
    role: "Finished-goods courier",
    code: "SHIP-06",
    num: 6,
    accent: 0x4c8dff,
    secondary: 0x2ee6a6,
    dance: "Delivery shuffle",
    body: "truck",
  },
  ink: {
    name: "Inky",
    shortName: "Ink",
    role: "Ink-room colour mixer",
    code: "INK-07",
    num: 7,
    accent: 0x00cfff,
    secondary: 0xff2e8c,
    dance: "Colour splash",
    body: "mixer",
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
  prepress: {
    name: "Pixel",
    shortName: "Prepress",
    role: "Prepress and plate assistant",
    code: "PLATE-09",
    num: 9,
    accent: 0x38bdf8,
    secondary: 0x8b5cf6,
    dance: "Pixel pop",
    body: "platesetter",
  },
  foil: {
    name: "Foilio",
    shortName: "Foil",
    role: "Foil-stamping specialist",
    code: "FOIL-10",
    num: 10,
    accent: 0xffc83d,
    secondary: 0xff6b35,
    dance: "Golden glide",
    body: "stamper",
  },
  glue: {
    name: "Glu-Bug",
    shortName: "Gluing",
    role: "Folding and gluing helper",
    code: "GLUE-11",
    num: 11,
    accent: 0x67e8a5,
    secondary: 0xf472b6,
    dance: "Sticky step",
    body: "glueline",
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

  /* --- new bodies, not humanoid at all ------------------------------ */
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
  reel: {
    name: "Bobbin",
    shortName: "Reel",
    role: "Substrate reel handler",
    code: "REEL-15",
    num: 15,
    accent: 0xfde68a,
    secondary: 0x38bdf8,
    dance: "Rock and roll",
    body: "roll",
  },
  stacker: {
    name: "Stax",
    shortName: "Stacker",
    role: "Carton palletising tower",
    code: "STAK-16",
    num: 16,
    accent: 0xfb923c,
    secondary: 0x22d3ee,
    dance: "Stack shuffle",
    body: "stack",
  },
  gripper: {
    name: "Axis",
    shortName: "Gripper",
    role: "Six-axis pick-and-place arm",
    code: "ARM-17",
    num: 17,
    accent: 0xf43f5e,
    secondary: 0x22d3ee,
    dance: "Servo sweep",
    body: "arm",
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

  /* --- soft and deforming bodies ------------------------------------ */
  wavy: {
    name: "Flappy",
    shortName: "Wavy",
    role: "Inflatable welcome dancer",
    code: "AIR-19",
    num: 19,
    accent: 0x38bdf8,
    secondary: 0xf472b6,
    dance: "Air-blown flail",
    body: "tube",
  },
  conveyor: {
    name: "Segment",
    shortName: "Conveyor",
    role: "Segmented line crawler",
    code: "CONV-20",
    num: 20,
    accent: 0xfbbf24,
    secondary: 0x34d399,
    dance: "Travelling wave",
    body: "crawler",
  },
  droplet: {
    name: "Splot",
    shortName: "Ink drop",
    role: "Liquid ink sample",
    code: "DROP-21",
    num: 21,
    accent: 0x22d3ee,
    secondary: 0xe879f9,
    dance: "Squash and splash",
    body: "drop",
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

  /* --- department characters (reuse existing bodies) ----------------- */
  mis: {
    name: "Nexus",
    shortName: "MIS/IT",
    role: "MIS and systems team",
    code: "MIS-23",
    num: 23,
    accent: 0x818cf8,
    secondary: 0x22d3ee,
    dance: "Uptime sweep",
    body: "rack",
  },
  finance: {
    name: "Ledger",
    shortName: "Finance",
    role: "Finance and costing",
    code: "FIN-24",
    num: 24,
    accent: 0x34d399,
    secondary: 0xfacc15,
    dance: "Balance bounce",
    body: "vault",
  },
  hr: {
    name: "Buddy",
    shortName: "HR",
    role: "People and welfare team",
    code: "HR-25",
    num: 25,
    accent: 0xf472b6,
    secondary: 0xfde68a,
    dance: "Welcome wave",
    body: "kiosk",
  },
  sales: {
    name: "Pitch",
    shortName: "Sales",
    role: "Sales and client team",
    code: "SLS-26",
    num: 26,
    accent: 0xfb7185,
    secondary: 0x38bdf8,
    dance: "Closing shuffle",
    body: "trolley",
  },

  /* --- party host ---------------------------------------------------- */
  dancer: {
    name: "Twirl",
    shortName: "Dancer",
    role: "Get-together dance host",
    code: "DANCE-27",
    num: 27,
    accent: 0xf472b6,
    secondary: 0xfacc15,
    dance: "Spin and flare",
    body: "dancer",
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
