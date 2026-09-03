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
  image.src = "/sc-printing-logo.png";

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
  badge.position.set(...options.position);
  badge.rotation.set(...(options.rotation ?? [0, 0, 0]));
  badge.renderOrder = 3;
  parent.add(badge);
  return badge;
}

export function createPalette(accent: number, secondary: number) {
  const metal = new THREE.MeshStandardMaterial({
    color: 0x9aa3ad,
    metalness: 0.82,
    roughness: 0.24,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x20262d,
    metalness: 0.75,
    roughness: 0.28,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x090b0e,
    metalness: 0.18,
    roughness: 0.48,
  });
  const screen = new THREE.MeshPhysicalMaterial({
    color: 0x02070b,
    metalness: 0.18,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const paper = new THREE.MeshStandardMaterial({
    color: 0xf4f7f8,
    metalness: 0.02,
    roughness: 0.72,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 1.5,
    metalness: 0.32,
    roughness: 0.24,
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
