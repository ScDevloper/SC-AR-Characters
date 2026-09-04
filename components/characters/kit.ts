import * as THREE from "three";

export const YELLOW = 0xffd84a;
export const BLACK = 0x111419;

/**
 * Every character - humanoid or not - hands back this same object, so the scene
 * harness never needs to know what shape the body actually is. `update` is the
 * character's own dance; `rest` is its idle pose.
 */
export type Spinner = { part: THREE.Object3D; axis: "x" | "y" | "z"; speed: number };

export type CharacterRig = {
  root: THREE.Group;
  /** Parts that spin continuously, even while the dance is paused. */
  spinners: Spinner[];
  update: (ctx: { t: number; beat: number; delta: number }) => void;
  rest: () => void;
  /** Optional camera framing for tall or wide bodies. */
  frame?: { camera: [number, number, number]; target: [number, number, number] };
};

export type Palette = ReturnType<typeof createPalette>;

type BrandBadgeOptions = {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  /** Adds a metallic housing and illuminated frame for a freestanding 3D sign. */
  depth?: number;
  accent?: number;
};

/**
 * Adds the SC Printing event identity as a real mesh attached to a character.
 * The logo and wording are drawn into one high-resolution texture so the
 * badge follows every dance, rotation and AR placement with the model.
 */
export function addBrandBadge(parent: THREE.Object3D, options: BrandBadgeOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  };

  const draw = (logo?: HTMLImageElement) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(7, 20, 58, 0.97)");
    gradient.addColorStop(1, "rgba(15, 35, 92, 0.94)");
    roundedRect(6, 6, 1012, 308, 52);
    context.fillStyle = gradient;
    context.fill();
    context.lineWidth = 8;
    context.strokeStyle = "rgba(79, 220, 255, 0.9)";
    context.stroke();

    roundedRect(30, 28, 264, 264, 44);
    context.fillStyle = "#ffffff";
    context.fill();

    if (logo) {
      context.drawImage(logo, 48, 46, 228, 228);
    } else {
      context.fillStyle = "#263d87";
      context.font = "900 118px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("SC", 162, 164);
    }

    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#ffffff";
    context.font = "900 72px Arial, sans-serif";
    context.fillText("SC PRINTING", 332, 137);
    context.fillStyle = "#68e8ff";
    context.font = "700 43px Arial, sans-serif";
    context.fillText("ANNUAL GET-TOGETHER", 332, 211);
    context.fillStyle = "rgba(255,255,255,0.72)";
    context.font = "600 25px Arial, sans-serif";
    context.fillText("3D CHARACTER COLLECTION", 334, 260);
  };

  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    draw(image);
    texture.needsUpdate = true;
  };
  image.src = `${import.meta.env.BASE_URL}sc-printing-logo.png`;

  const [width, height] = options.size ?? [1.25, 0.39];
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.03,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  badge.renderOrder = 3;

  if (!options.depth) {
    badge.position.set(...options.position);
    badge.rotation.set(...(options.rotation ?? [0, 0, 0]));
    parent.add(badge);
    return badge;
  }

  const sign = new THREE.Group();
  const depth = options.depth;
  const accent = options.accent ?? 0x38d9ff;
  const shell = new THREE.MeshStandardMaterial({
    color: 0x101a25,
    metalness: 0.88,
    roughness: 0.2,
  });
  const neon = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 2.5,
    metalness: 0.38,
    roughness: 0.18,
  });

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, height + 0.2, depth),
    shell,
  );
  backing.castShadow = true;
  backing.receiveShadow = true;
  sign.add(backing);

  const frontZ = depth / 2 + 0.012;
  badge.position.z = frontZ;
  sign.add(badge);

  const railDepth = depth + 0.055;
  const horizontalRail = new THREE.BoxGeometry(width + 0.22, 0.055, railDepth);
  const verticalRail = new THREE.BoxGeometry(0.055, height + 0.11, railDepth);
  for (const y of [-(height + 0.145) / 2, (height + 0.145) / 2]) {
    const rail = new THREE.Mesh(horizontalRail, neon);
    rail.position.y = y;
    sign.add(rail);
  }
  for (const x of [-(width + 0.145) / 2, (width + 0.145) / 2]) {
    const rail = new THREE.Mesh(verticalRail, neon);
    rail.position.x = x;
    sign.add(rail);
  }

  const boltGeometry = new THREE.SphereGeometry(0.035, 16, 12);
  for (const x of [-width / 2 + 0.07, width / 2 - 0.07]) {
    for (const y of [-height / 2 + 0.07, height / 2 - 0.07]) {
      const bolt = new THREE.Mesh(boltGeometry, neon);
      bolt.position.set(x, y, frontZ + 0.025);
      sign.add(bolt);
    }
  }

  sign.position.set(...options.position);
  sign.rotation.set(...(options.rotation ?? [0, 0, 0]));
  parent.add(sign);
  return sign;
}

/* ------------------------------------------------------------------ *
 * Shared procedural surface maps
 *
 * Uniform roughness is the biggest "CG" tell: every panel on a real machine
 * carries brush marks, wear and fingerprints, so highlights break up across a
 * surface instead of sitting perfectly even.
 *
 * Built once at module level and shared by all 26 characters - a canvas
 * texture per character would multiply GPU memory for no visual gain.
 * ------------------------------------------------------------------ */

type SurfaceMaps = { brushed: THREE.Texture; wear: THREE.Texture };
let surfaceMaps: SurfaceMaps | null | undefined;

function paintTexture(
  size: number,
  repeat: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext("2d") as CanvasRenderingContext2D, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

function getSurfaceMaps(): SurfaceMaps | null {
  if (surfaceMaps !== undefined) return surfaceMaps;
  if (typeof document === "undefined") {
    surfaceMaps = null;   // server render or headless test
    return null;
  }

  // Brushed metal: fine directional streaks, so highlights smear along the
  // grain instead of forming a mirror.
  const brushed = paintTexture(256, 3, (ctx, size) => {
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const shade = 150 + Math.floor(Math.random() * 105);
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.5)`;
      ctx.lineWidth = Math.random() < 0.85 ? 1 : 2;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
  });

  // Wear: soft blotches for rubber, board and painted panels.
  const wear = paintTexture(256, 2, (ctx, size) => {
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) {
      const shade = 120 + Math.floor(Math.random() * 135);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.32)`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 4 + Math.random() * 26, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  surfaceMaps = { brushed, wear };
  return surfaceMaps;
}

export function createPalette(accent: number, secondary: number) {
  const maps = getSurfaceMaps();

  // Brushed aluminium. `anisotropy` stretches the specular highlight along the
  // grain - the property that separates machined metal from chrome.
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x9aa3ad,
    metalness: 0.95,
    roughness: 0.34,
    roughnessMap: maps?.brushed ?? null,
    anisotropy: 0.6,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.2,
  });
  // Painted steel: a clearcoat over a duller base, which is how machine
  // housings behave under shop lighting.
  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x20262d,
    metalness: 0.62,
    roughness: 0.42,
    roughnessMap: maps?.wear ?? null,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    specularIntensity: 0.7,
    envMapIntensity: 1.0,
  });
  // Rubber scatters rather than reflects: high roughness, faint sheen, and
  // deliberately no clearcoat.
  const rubber = new THREE.MeshPhysicalMaterial({
    color: 0x090b0e,
    metalness: 0.0,
    roughness: 0.92,
    roughnessMap: maps?.wear ?? null,
    sheen: 0.25,
    sheenRoughness: 0.9,
    sheenColor: new THREE.Color(0x2a2f36),
    envMapIntensity: 0.45,
  });
  const screen = new THREE.MeshPhysicalMaterial({
    color: 0x02070b,
    metalness: 0.18,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    // Faint oil-slick tint across the glass, as on a real coated display.
    iridescence: 0.35,
    iridescenceIOR: 1.6,
    specularIntensity: 1.0,
    envMapIntensity: 1.4,
  });
  // Board and paper are fibrous - sheen is what stops them reading as painted
  // plastic.
  const paper = new THREE.MeshPhysicalMaterial({
    color: 0xf4f7f8,
    metalness: 0.0,
    roughness: 0.82,
    roughnessMap: maps?.wear ?? null,
    sheen: 0.4,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color(0xffffff),
    envMapIntensity: 0.6,
  });
  const cyan = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 1.5,
    metalness: 0.32,
    roughness: 0.24,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.1,
  });
  const magenta = cyan.clone();
  magenta.color.setHex(secondary);
  magenta.emissive.setHex(secondary);
  const yellow = cyan.clone();
  yellow.color.setHex(YELLOW);
  yellow.emissive.setHex(0x6a4c00);
  const inkBlack = cyan.clone();
  inkBlack.color.setHex(BLACK);
  inkBlack.emissive.setHex(0x020303);
  const glow = new THREE.MeshBasicMaterial({ color: 0xc9f7ff });
  const film = new THREE.MeshPhysicalMaterial({
    color: accent,
    transparent: true,
    opacity: 0.24,
    transmission: 0.72,
    roughness: 0.08,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  return { metal, darkMetal, rubber, screen, paper, cyan, magenta, yellow, inkBlack, glow, film };
}

export function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Diagonal yellow/black hazard chevrons, baked into a tileable canvas
 * texture. Cheaper and far more convincing than stacking angled boxes -
 * this is what actually reads as "industrial machine" on a counterweight,
 * bumper edge, or guard rail.
 */
export function createHazardTexture(repeats = 4) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#15171c";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffcc00";
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(Math.PI / 4);
  ctx.translate(-size, -size);
  const stripe = (size * 2) / 8;
  for (let i = 0; i < 16; i += 2) {
    ctx.fillRect(i * stripe, -size, stripe, size * 4);
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeats, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Slatted (roller-shutter) or woven (conveyor-belt) grooved surface. */
export function createGrooveTexture(baseColor: string, lines = 14, tint = "rgba(0,0,0,0.22)") {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 3;
  const step = size / lines;
  for (let i = 1; i < lines; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A small white rating/ID plate with one bold line and one detail line. */
export function createPlateTexture(title: string, detail: string, accent = "#1c64f2") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#eef2f5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#20262d";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = "800 46px Arial, sans-serif";
  ctx.fillText(title, canvas.width / 2, 92);
  ctx.fillStyle = "#3a4048";
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText(detail, canvas.width / 2, 140);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Two glowing eyes plus a smile, sized to whatever face plate you give it. */
export function addFace(parent: THREE.Object3D, palette: Palette, scale = 1) {
  const eyes = new THREE.Group();
  parent.add(eyes);
  for (const x of [-0.39 * scale, 0.39 * scale]) {
    addMesh(
      eyes,
      new THREE.SphereGeometry(0.115 * scale, 24, 16),
      palette.glow,
      [x, 0.14 * scale, 0],
    ).scale.set(1, 1.35, 0.28);
  }
  const smile = addMesh(
    eyes,
    new THREE.TorusGeometry(0.26 * scale, 0.038 * scale, 12, 32, Math.PI),
    palette.glow,
    [0, -0.11 * scale, 0],
    [0, 0, Math.PI],
  );
  smile.scale.y = 0.55;
  return eyes;
}
