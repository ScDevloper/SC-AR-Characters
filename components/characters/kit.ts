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
