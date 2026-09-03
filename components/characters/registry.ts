/**
 * One entry per character. `body` picks the 3D archetype, so two characters
 * only look alike if they deliberately share a body.
 */

export type BodyKind = "humanoid" | "rover" | "drone" | "roll" | "stack" | "arm" | "quad";

export type CharacterConfig = {
  name: string;
  shortName: string;
  role: string;
  code: string;
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
    accent: 0x19d9ff,
    secondary: 0xff2e8c,
    dance: "Roller groove",
    body: "humanoid",
  },
  diecut: {
    name: "CutBot",
    shortName: "Die-cut",
    role: "Precision die-cutting unit",
    code: "CUT-02",
    accent: 0xff8a1f,
    secondary: 0xffd84a,
    dance: "Cutter twist",
    body: "humanoid",
  },
  laminate: {
    name: "LamiBot",
    shortName: "Laminate",
    role: "Lamination specialist",
    code: "LAMI-03",
    accent: 0x2ee6a6,
    secondary: 0x55a7ff,
    dance: "Film-flow disco",
    body: "humanoid",
  },
  quality: {
    name: "Q-Bot",
    shortName: "Quality",
    role: "Quality inspection scanner",
    code: "QC-04",
    accent: 0xa879ff,
    secondary: 0x19d9ff,
    dance: "Scanner swing",
    body: "humanoid",
  },
  carton: {
    name: "PackBot",
    shortName: "Carton",
    role: "Carton forming assistant",
    code: "PACK-05",
    accent: 0xffd84a,
    secondary: 0xff6a3d,
    dance: "Boxy bounce",
    body: "humanoid",
  },
  dispatch: {
    name: "DashBot",
    shortName: "Dispatch",
    role: "Finished-goods courier",
    code: "SHIP-06",
    accent: 0x4c8dff,
    secondary: 0x2ee6a6,
    dance: "Delivery shuffle",
    body: "humanoid",
  },
  ink: {
    name: "Inky",
    shortName: "Ink",
    role: "Ink-room colour mixer",
    code: "INK-07",
    accent: 0x00cfff,
    secondary: 0xff2e8c,
    dance: "Colour splash",
    body: "humanoid",
  },
  paper: {
    name: "Rollie",
    shortName: "Paper",
    role: "Paper-roll handling unit",
    code: "ROLL-08",
    accent: 0xe8f4ff,
    secondary: 0x4c8dff,
    dance: "Roll and rock",
    body: "humanoid",
  },
  prepress: {
    name: "Pixel",
    shortName: "Prepress",
    role: "Prepress and plate assistant",
    code: "PLATE-09",
    accent: 0x38bdf8,
    secondary: 0x8b5cf6,
    dance: "Pixel pop",
    body: "humanoid",
  },
  foil: {
    name: "Foilio",
    shortName: "Foil",
    role: "Foil-stamping specialist",
    code: "FOIL-10",
    accent: 0xffc83d,
    secondary: 0xff6b35,
    dance: "Golden glide",
    body: "humanoid",
  },
  glue: {
    name: "Glu-Bug",
    shortName: "Gluing",
    role: "Folding and gluing helper",
    code: "GLUE-11",
    accent: 0x67e8a5,
    secondary: 0xf472b6,
    dance: "Sticky step",
    body: "humanoid",
  },
  maintenance: {
    name: "Gearo",
    shortName: "Maintenance",
    role: "Maintenance and uptime crew",
    code: "FIX-12",
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
    accent: 0xc084fc,
    secondary: 0x4ade80,
    dance: "Wave walk",
    body: "quad",
  },
} as const satisfies Record<string, CharacterConfig>;

export type CharacterId = keyof typeof CHARACTERS;

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];

export function isCharacterId(value: string | null | undefined): value is CharacterId {
  return Boolean(value && value in CHARACTERS);
}

/** `0x19d9ff` -> `#19d9ff`, for CSS and SVG. */
export function hex(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}
