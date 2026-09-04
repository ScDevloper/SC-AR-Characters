import * as THREE from "three";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/**
 * Procedural human dancer.
 *
 * The important part of this model is the hierarchy: pelvis -> spine -> neck
 * -> head and shoulder -> upper arm -> forearm -> hand, with three-part legs.
 * Keeping the joints separate lets the animation create natural weight shift,
 * counter rotation and delayed secondary motion without changing the scene
 * harness or registry.
 */

const BODY_TONE = 0xf0d9c0;
const BODY_TONE_DARK = 0xd8aa91;
const HAIR_TONE = 0x241a18;

function latheProfile(
  radii: number[],
  length: number,
  segments = 24,
  curve: (t: number) => number = (t) => t,
) {
  const points: THREE.Vector2[] = [];
  const count = radii.length - 1;

  for (let i = 0; i < radii.length; i++) {
    const t = i / count;
    points.push(new THREE.Vector2(Math.max(radii[i], 0.008), -curve(t) * length));
  }

  return new THREE.LatheGeometry(points, segments);
}

/** Human muscle profile rather than a constant-radius cylinder. */
function limbGeometry(
  top: number,
  mid: number,
  bottom: number,
  length: number,
  segments = 20,
) {
  return latheProfile(
    [top, top * 1.05, mid, mid * 0.96, bottom * 1.04, bottom],
    length,
    segments,
    (t) => t,
  );
}

function addRoundedLimb(
  parent: THREE.Object3D,
  material: THREE.Material,
  position: [number, number, number],
  top: number,
  mid: number,
  bottom: number,
  length: number,
  /** Radial segments. Drop it for small parts - fingers do not need 20. */
  segments = 20,
) {
  return addMesh(parent, limbGeometry(top, mid, bottom, length, segments), material, position);
}

function addEllipsoid(
  parent: THREE.Object3D,
  material: THREE.Material,
  position: [number, number, number],
  scale: [number, number, number],
  radius = 1,
) {
  const mesh = addMesh(parent, new THREE.SphereGeometry(radius, 28, 20), material, position);
  mesh.scale.set(...scale);
  return mesh;
}

/** A flared garment surface with radial folds modelled into its silhouette. */
function flaredSkirtGeometry(
  top: number,
  hem: number,
  drop: number,
  pleats = 12,
  phase = 0,
) {
  const segments = 64;
  const rings = 18;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const eased = t * t * (3 - 2 * t);
    const baseRadius = THREE.MathUtils.lerp(top, hem, eased);
    for (let segment = 0; segment <= segments; segment++) {
      const u = segment / segments;
      const angle = u * Math.PI * 2;
      const pleat = Math.sin(angle * pleats + phase) * 0.055 * Math.pow(t, 1.35);
      const radius = baseRadius * (1 + pleat);
      positions.push(Math.sin(angle) * radius, -t * drop, Math.cos(angle) * radius);
      uvs.push(u, 1 - t);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildDancer(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  /* ------------------------------------------------------------------ *
   * Materials
   * ------------------------------------------------------------------ */

  const skin = new THREE.MeshPhysicalMaterial({
    color: BODY_TONE,
    roughness: 0.52,
    metalness: 0,
    sheen: 0.22,
    sheenRoughness: 0.62,
    sheenColor: new THREE.Color(0xffe4d5),
    clearcoat: 0.06,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.8,
  });

  const skinDark = new THREE.MeshPhysicalMaterial({
    color: BODY_TONE_DARK,
    roughness: 0.58,
    metalness: 0,
    sheen: 0.16,
    sheenRoughness: 0.7,
    envMapIntensity: 0.7,
  });

  const dress = new THREE.MeshPhysicalMaterial({
    color: cyan.color.clone(),
    roughness: 0.72,
    metalness: 0,
    sheen: 0.9,
    sheenRoughness: 0.42,
    sheenColor: magenta.color.clone(),
    side: THREE.DoubleSide,
    envMapIntensity: 0.85,
  });

  const underskirt = dress.clone();
  underskirt.color = magenta.color.clone();
  underskirt.sheenColor = cyan.color.clone();
  underskirt.roughness = 0.8;

  const hair = new THREE.MeshPhysicalMaterial({
    color: HAIR_TONE,
    roughness: 0.34,
    metalness: 0,
    sheen: 0.72,
    sheenRoughness: 0.25,
    sheenColor: new THREE.Color(0x8b6557),
    clearcoat: 0.3,
    clearcoatRoughness: 0.32,
    envMapIntensity: 0.9,
  });

  const hairHighlight = hair.clone();
  hairHighlight.color = new THREE.Color(0x3b2925);
  hairHighlight.roughness = 0.29;

  const trim = new THREE.MeshPhysicalMaterial({
    color: magenta.color.clone(),
    roughness: 0.43,
    metalness: 0.18,
    sheen: 0.5,
    envMapIntensity: 0.95,
  });

  const shoe = new THREE.MeshPhysicalMaterial({
    color: 0x161b24,
    roughness: 0.32,
    metalness: 0.08,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.9,
  });

  const sole = new THREE.MeshStandardMaterial({
    color: 0x090b10,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.65,
  });

  const eyeWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf7f4ee,
    roughness: 0.3,
    metalness: 0,
    envMapIntensity: 0.7,
  });

  const iris = new THREE.MeshPhysicalMaterial({
    color: 0x4c332c,
    roughness: 0.24,
    metalness: 0,
    clearcoat: 0.4,
    envMapIntensity: 0.8,
  });

  const lip = new THREE.MeshPhysicalMaterial({
    color: 0xb65f69,
    roughness: 0.44,
    metalness: 0,
    sheen: 0.25,
    envMapIntensity: 0.65,
  });

  const darkFeature = new THREE.MeshStandardMaterial({
    color: 0x5a3731,
    roughness: 0.55,
    metalness: 0,
  });
  const pupilMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x120d0c,
    roughness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  });
  const eyeGlint = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const blush = new THREE.MeshPhysicalMaterial({
    color: 0xe89b9e,
    transparent: true,
    opacity: 0.18,
    roughness: 0.85,
    depthWrite: false,
  });

  /* ------------------------------------------------------------------ *
   * Pelvis and articulated spine
   * ------------------------------------------------------------------ */

  const hips = new THREE.Group();
  hips.position.y = 1.13;
  root.add(hips);

  const pelvis = addEllipsoid(hips, skin, [0, 0.08, 0], [0.31, 0.26, 0.19], 1);
  pelvis.rotation.x = -0.04;

  const waist = new THREE.Group();
  waist.position.y = 0.24;
  hips.add(waist);
  const waistMesh = addRoundedLimb(waist, skin, [0, 0, 0], 0.245, 0.255, 0.275, 0.27);
  waistMesh.scale.z = 0.82;

  const chest = new THREE.Group();
  chest.position.y = 0.29;
  waist.add(chest);

  const ribcage = addEllipsoid(chest, skin, [0, 0.2, 0], [0.34, 0.46, 0.25], 1);
  // These ellipsoids carry their shape in `scale`, so anything animating them
  // must MULTIPLY that base - assigning an absolute value throws the shape away.
  const ribcageBase = ribcage.scale.clone();
  ribcage.rotation.x = Math.PI;

  // Dress bodice follows the rib cage instead of looking like a straight tube.
  const bodice = addMesh(
    chest,
    latheProfile([0.28, 0.32, 0.34, 0.335, 0.305], 0.62, 32, (t) => t),
    dress,
    [0, 0.06, 0],
  );
  bodice.scale.z = 0.78;

  // Collar bones and shoulder contours stop the upper body reading as a tube.
  for (const side of [-1, 1]) {
    addMesh(
      chest,
      new THREE.CapsuleGeometry(0.018, 0.19, 5, 12),
      skinDark,
      [side * 0.105, 0.44, 0.205],
      [0, 0, side * (Math.PI / 2 - 0.2)],
    ).scale.z = 0.55;
  }

  addMesh(
    chest,
    new THREE.TorusGeometry(0.305, 0.025, 10, 36),
    trim,
    [0, -0.04, 0],
    [Math.PI / 2, 0, 0],
  );

  // A subtle neckline.
  addMesh(
    chest,
    new THREE.TorusGeometry(0.245, 0.018, 8, 32, Math.PI * 1.45),
    trim,
    [0, 0.45, 0.012],
    [Math.PI / 2, 0, Math.PI],
  );

  /* ------------------------------------------------------------------ *
   * Neck and face
   * ------------------------------------------------------------------ */

  const neck = new THREE.Group();
  neck.position.y = 0.66;
  chest.add(neck);
  addRoundedLimb(neck, skin, [0, 0, 0], 0.095, 0.105, 0.11, 0.2);

  const head = new THREE.Group();
  head.position.y = 0.22;
  neck.add(head);

  // Head silhouette: cranium + cheeks + jaw + chin.
  const cranium = addEllipsoid(head, skin, [0, 0.18, 0], [0.285, 0.34, 0.265], 1);
  cranium.rotation.x = -0.02;

  const cheeks = addEllipsoid(head, skin, [0, 0.01, 0.025], [0.245, 0.23, 0.235], 1);
  cheeks.scale.z *= 0.94;

  const jaw = addEllipsoid(head, skin, [0, -0.08, 0.035], [0.20, 0.17, 0.18], 1);
  jaw.scale.y *= 0.82; // multiply: the ellipsoid's shape lives in its scale

  addEllipsoid(head, skin, [0, -0.17, 0.07], [0.095, 0.065, 0.075], 1);

  // Nose bridge and soft nose tip.
  addMesh(
    head,
    new THREE.CapsuleGeometry(0.026, 0.075, 6, 12),
    skin,
    [0, 0.045, 0.27],
    [Math.PI / 2, 0, 0],
  );
  addEllipsoid(head, skinDark, [0, -0.005, 0.305], [0.052, 0.04, 0.06], 1);
  for (const side of [-1, 1]) {
    addEllipsoid(head, darkFeature, [side * 0.022, -0.022, 0.352], [0.009, 0.006, 0.005], 1);
  }

  // Eyes are intentionally separate from addFace: that shared helper is
  // designed for the stylized machine characters.
  const face = new THREE.Group();
  face.position.set(0, 0.12, 0.25);
  head.add(face);

  const eyeWhites: { mesh: THREE.Mesh; base: THREE.Vector3 }[] = [];
  for (const side of [-1, 1]) {
    const eye = addEllipsoid(face, eyeWhite, [side * 0.105, 0.045, 0], [0.078, 0.052, 0.026], 1);
    eye.rotation.z = side * -0.05;
    eyeWhites.push({ mesh: eye, base: eye.scale.clone() });

    addEllipsoid(face, iris, [side * 0.105, 0.043, 0.024], [0.031, 0.035, 0.012], 1);
    addEllipsoid(face, pupilMaterial, [side * 0.105, 0.043, 0.035], [0.014, 0.017, 0.007], 1);
    addEllipsoid(face, eyeGlint, [side * 0.097, 0.054, 0.042], [0.0048, 0.006, 0.003], 1);

    addEllipsoid(face, darkFeature, [side * 0.105, 0.105, 0.005], [0.078, 0.012, 0.012], 1);
  }

  // Soft cheek colour and short upper lashes create a natural expression.
  for (const side of [-1, 1]) {
    addEllipsoid(face, blush, [side * 0.155, -0.035, 0.006], [0.065, 0.028, 0.008], 1);
    for (let lash = 0; lash < 3; lash++) {
      addMesh(
        face,
        new THREE.CapsuleGeometry(0.0035, 0.024, 3, 7),
        darkFeature,
        [side * (0.075 + lash * 0.027), 0.092 - Math.abs(lash - 1) * 0.005, 0.032],
        [0, 0, side * (-0.42 + lash * 0.16)],
      );
    }
  }

  // Brows, lips and a tiny lower-lip highlight make the face read at camera distance.
  for (const side of [-1, 1]) {
    addMesh(
      face,
      new THREE.CapsuleGeometry(0.009, 0.065, 4, 8),
      darkFeature,
      [side * 0.105, 0.125, 0.006],
      [0, 0, side * 0.1],
    );
  }

  addMesh(
    face,
    new THREE.TorusGeometry(0.043, 0.012, 8, 20, Math.PI),
    lip,
    [0, -0.085, 0.015],
    [0, 0, Math.PI],
  );
  addEllipsoid(face, lip, [0, -0.099, 0.018], [0.032, 0.009, 0.008], 1);

  // Ears.
  for (const side of [-1, 1]) {
    addEllipsoid(head, skin, [side * 0.275, 0.08, 0.01], [0.045, 0.07, 0.035], 1);
    addMesh(
      head,
      new THREE.TorusGeometry(0.027, 0.005, 6, 14),
      skinDark,
      [side * 0.282, 0.08, 0.035],
      [Math.PI / 2, 0, 0],
    );
  }

  /* ------------------------------------------------------------------ *
   * Hair: cap + layered strands + articulated ponytail
   * ------------------------------------------------------------------ */

  const hairCap = addMesh(
    head,
    new THREE.SphereGeometry(0.305, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hair,
    [0, 0.19, -0.015],
  );
  hairCap.scale.set(1.01, 1.08, 1.03);

  // Side locks follow the cheeks.
  const strands: { strand: THREE.Group; side: number; phase: number }[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const strand = new THREE.Group();
      strand.position.set(side * (0.235 + i * 0.018), 0.31 - i * 0.035, 0.02);
      head.add(strand);
      addRoundedLimb(strand, hair, [0, 0, 0], 0.045, 0.052, 0.018, 0.39 + i * 0.08);
      strand.rotation.z = side * (0.08 + i * 0.03);
      strands.push({ strand, side, phase: i * 0.3 });
    }
  }

  const pony = new THREE.Group();
  pony.position.set(0, 0.34, -0.25);
  head.add(pony);
  addEllipsoid(pony, hair, [0, 0, 0], [0.14, 0.17, 0.13], 1);
  addMesh(
    pony,
    new THREE.TorusGeometry(0.115, 0.018, 8, 22),
    trim,
    [0, -0.03, 0.015],
    [Math.PI / 2, 0, 0],
  );

  const ponyLinks: THREE.Group[] = [];
  let ponyParent: THREE.Object3D = pony;
  for (let i = 0; i < 5; i++) {
    const segment = new THREE.Group();
    segment.position.y = i === 0 ? -0.07 : -0.19;
    segment.position.z = -0.015 - i * 0.008;
    ponyParent.add(segment);
    addRoundedLimb(
      segment,
      i % 2 === 0 ? hair : hairHighlight,
      [0, 0, 0],
      0.09 - i * 0.012,
      0.095 - i * 0.014,
      0.055 - i * 0.008,
      0.22,
    );
    ponyLinks.push(segment);
    ponyParent = segment;
  }

  // Shared face helper is retained only as a subtle fallback accent, keeping
  // this body compatible with the existing palette/kit contract.
  const faceAccent = addFace(head, palette, 0.34);
  faceAccent.position.set(0, 0.16, -0.015);
  faceAccent.scale.setScalar(0.01);

  /* ------------------------------------------------------------------ *
   * Arms: shoulder, upper arm, elbow, forearm, wrist and articulated hand
   * ------------------------------------------------------------------ */

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.33, 0.49, 0);
    chest.add(shoulder);

    addEllipsoid(shoulder, skin, [0, 0, 0], [0.115, 0.12, 0.115], 1);

    const upperArm = new THREE.Group();
    upperArm.position.y = -0.055;
    shoulder.add(upperArm);
    addRoundedLimb(upperArm, skin, [0, 0, 0], 0.09, 0.105, 0.07, 0.39);

    const elbow = new THREE.Group();
    elbow.position.y = -0.40;
    upperArm.add(elbow);
    addEllipsoid(elbow, skin, [0, 0, 0], [0.075, 0.075, 0.072], 1);

    const forearm = new THREE.Group();
    forearm.position.y = -0.045;
    elbow.add(forearm);
    addRoundedLimb(forearm, skin, [0, 0, 0], 0.072, 0.078, 0.052, 0.36);

    const wrist = new THREE.Group();
    wrist.position.y = -0.365;
    forearm.add(wrist);
    addEllipsoid(wrist, skin, [0, 0, 0], [0.052, 0.045, 0.052], 1);

    const hand = new THREE.Group();
    hand.position.y = -0.055;
    wrist.add(hand);

    const palm = addEllipsoid(hand, skin, [0, -0.045, 0], [0.075, 0.095, 0.048], 1);
    palm.rotation.z = side * 0.06;

    const fingerGroups: THREE.Group[] = [];
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Group();
      finger.position.set((f - 1.5) * 0.026, -0.12, 0.008);
      hand.add(finger);
      addRoundedLimb(finger, skin, [0, 0, 0], 0.014, 0.015, 0.009, 0.085, 12);
      const tip = new THREE.Group();
      tip.position.y = -0.087;
      finger.add(tip);
      addRoundedLimb(tip, skin, [0, 0, 0], 0.011, 0.011, 0.007, 0.055, 12);
      fingerGroups.push(finger);
      addEllipsoid(tip, eyeWhite, [0, -0.047, 0.012], [0.007, 0.012, 0.003], 1);
    }

    const thumb = new THREE.Group();
    thumb.position.set(side * 0.067, -0.04, 0.005);
    hand.add(thumb);
    addRoundedLimb(thumb, skin, [0, 0, 0], 0.017, 0.018, 0.011, 0.085, 12);

    addMesh(
      wrist,
      new THREE.TorusGeometry(0.058, 0.012, 8, 22),
      trim,
      [0, -0.015, 0],
      [Math.PI / 2, 0, 0],
    );

    return { shoulder, upperArm, elbow, forearm, wrist, hand, fingerGroups, thumb, side };
  });

  /* ------------------------------------------------------------------ *
   * Dress and skirt
   * ------------------------------------------------------------------ */

  const skirt = new THREE.Group();
  skirt.position.y = 0.06;
  hips.add(skirt);

  const outerSkirt = addMesh(
    skirt,
    flaredSkirtGeometry(0.31, 0.52, 0.86, 12),
    dress,
    [0, 0, 0],
  );
  const innerSkirt = addMesh(
    skirt,
    flaredSkirtGeometry(0.285, 0.425, 0.71, 12, Math.PI / 12),
    underskirt,
    [0, -0.015, 0],
  );

  addMesh(
    skirt,
    new THREE.TorusGeometry(0.315, 0.028, 10, 48),
    trim,
    [0, 0.015, 0],
    [Math.PI / 2, 0, 0],
  );

  addMesh(
    skirt,
    new THREE.TorusGeometry(0.50, 0.022, 10, 48),
    trim,
    [0, -0.91, 0],
    [Math.PI / 2, 0, 0],
  );

  /* ------------------------------------------------------------------ *
   * Legs: pelvis -> thigh -> knee -> shin -> ankle -> shoe
   * ------------------------------------------------------------------ */

  const legs = [-1, 1].map((side) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * 0.14, -0.07, 0);
    hips.add(thigh);
    addRoundedLimb(thigh, skin, [0, 0, 0], 0.125, 0.15, 0.09, 0.59);

    const knee = new THREE.Group();
    knee.position.y = -0.6;
    thigh.add(knee);
    addEllipsoid(knee, skin, [0, 0, 0], [0.085, 0.08, 0.075], 1);

    const shin = new THREE.Group();
    shin.position.y = -0.045;
    knee.add(shin);
    addRoundedLimb(shin, skin, [0, 0, 0], 0.08, 0.085, 0.052, 0.57);

    const ankle = new THREE.Group();
    ankle.position.y = -0.58;
    shin.add(ankle);
    addEllipsoid(ankle, skin, [0, 0, 0], [0.055, 0.055, 0.055], 1);

    // Ballet-inspired shoe, with separate toe box and sole for a readable foot.
    const foot = new THREE.Group();
    foot.position.set(0, -0.035, 0.06);
    ankle.add(foot);

    const upper = addEllipsoid(foot, shoe, [0, 0, 0.075], [0.085, 0.055, 0.19], 1);
    upper.rotation.x = -0.06;
    addEllipsoid(foot, shoe, [0, 0.002, 0.19], [0.082, 0.05, 0.12], 1);
    addMesh(foot, new THREE.BoxGeometry(0.14, 0.025, 0.31), sole, [0, -0.047, 0.105]);

    // A slim ankle strap ties the shoe visually into the costume.
    addMesh(
      foot,
      new THREE.TorusGeometry(0.055, 0.009, 7, 20),
      trim,
      [0, 0.025, -0.02],
      [Math.PI / 2, 0, 0],
    ).scale.set(1.2, 1, 1.0);

    return { thigh, knee, shin, ankle, foot, side };
  });

  /* ------------------------------------------------------------------ *
   * Rest pose
   * ------------------------------------------------------------------ */

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);

    hips.position.set(0, 1.13, 0);
    hips.rotation.set(0, 0, 0);
    waist.rotation.set(0, 0, 0);
    chest.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    pony.rotation.set(0, 0, 0);
    ponyLinks.forEach((part) => part.rotation.set(0, 0, 0));
    skirt.rotation.set(0, 0, 0);
    skirt.scale.set(1, 1, 1);
    outerSkirt.rotation.set(0, 0, 0);
    innerSkirt.rotation.set(0, 0, 0);

    strands.forEach(({ strand, side }) => {
      strand.rotation.set(0, 0, side * 0.1);
    });

    arms.forEach(({ shoulder, upperArm, elbow, forearm, wrist, hand, fingerGroups, thumb, side }) => {
      shoulder.rotation.set(0, 0, side * 0.12);
      upperArm.rotation.set(0, 0, 0);
      elbow.rotation.set(0, 0, 0);
      forearm.rotation.set(0, 0, 0);
      wrist.rotation.set(0, 0, 0);
      hand.rotation.set(0, 0, 0);
      fingerGroups.forEach((finger) => finger.rotation.set(0, 0, 0));
      thumb.rotation.set(0, 0, 0);
    });

    legs.forEach(({ thigh, knee, shin, ankle, foot }) => {
      thigh.rotation.set(0, 0, 0);
      knee.rotation.set(0, 0, 0);
      shin.rotation.set(0, 0, 0);
      ankle.rotation.set(0, 0, 0);
      foot.rotation.set(0, 0, 0);
    });

    ribcage.scale.copy(ribcageBase);
    eyeWhites.forEach(({ mesh, base }) => mesh.scale.copy(base));
  };

  /* ------------------------------------------------------------------ *
   * Choreography
   * ------------------------------------------------------------------ */

  const update = ({ beat, delta }: { t: number; beat: number; delta: number }) => {
    const time = beat;
    const pulse = Math.sin(time);
    const fast = Math.sin(time * 2.0 - 0.45);
    const slow = Math.sin(time * 0.5);

    // Whole-body turn, with a deliberately smaller amplitude than the old
    // character so the feet still feel planted.
    root.rotation.y = slow * 0.62;

    // Weight shifts side-to-side through the pelvis before the chest catches up.
    const weight = Math.sin(time * 2);
    const support = Math.max(0, Math.abs(weight));
    hips.position.y = 1.13 + support * 0.045;
    hips.position.x = weight * 0.045;
    hips.rotation.z = pulse * 0.10;
    hips.rotation.y = Math.sin(time * 2 - 0.18) * 0.18;
    hips.rotation.x = Math.sin(time * 2 - 0.3) * 0.035;

    // Counter-rotation creates the loose, human spine seen in real dance.
    waist.rotation.z = -Math.sin(time * 2 - 0.35) * 0.07;
    waist.rotation.y = -Math.sin(time * 2 - 0.5) * 0.13;
    waist.rotation.x = Math.sin(time * 2 - 0.55) * 0.025;

    chest.rotation.z = -Math.sin(time * 2 - 0.48) * 0.085;
    chest.rotation.y = -Math.sin(time * 2 - 0.62) * 0.19;
    chest.rotation.x = Math.sin(time * 2 - 0.7) * 0.045;

    // Head is calmer than the torso: eyes and face remain visually stable.
    neck.rotation.z = Math.sin(time * 2 - 0.9) * 0.055;
    neck.rotation.y = Math.sin(time * 2 - 0.75) * 0.08;
    head.rotation.z = Math.sin(time * 2 - 1.05) * 0.075;
    head.rotation.y = Math.sin(time * 2 - 1.2) * 0.20;
    head.rotation.x = -Math.sin(time * 2 - 0.85) * 0.045;

    // Subtle breathing prevents the upper body from looking frozen.
    const breath = Math.sin(time * 0.55) * 0.012;
    ribcage.scale.set(
      ribcageBase.x * (1 + breath),
      ribcageBase.y * (1 + breath * 0.65),
      ribcageBase.z * (1 + breath),
    );

    /* Skirt: delayed response to pelvis rotation and turn velocity. */
    const turnVelocity = Math.abs(Math.cos(time * 0.5)) * 0.5 + Math.abs(pulse) * 0.35;
    const skirtFlutter = Math.abs(fast) * 0.12;
    skirt.scale.set(
      1 + turnVelocity * 0.17 + skirtFlutter,
      1 - turnVelocity * 0.025,
      1 + turnVelocity * 0.17 + skirtFlutter,
    );
    skirt.rotation.y = -Math.sin(time * 2 - 0.25) * 0.17;
    outerSkirt.rotation.z = Math.sin(time * 2 - 0.5) * 0.065;
    outerSkirt.rotation.x = Math.sin(time * 2 - 0.35) * 0.045;
    innerSkirt.rotation.z = Math.sin(time * 2 - 0.8) * 0.04;
    innerSkirt.rotation.x = Math.sin(time * 2 - 0.7) * 0.028;

    /* Hair trails behind the head instead of moving at the same time. */
    pony.rotation.x = 0.18 + Math.sin(time * 2 - 1.0) * 0.18;
    pony.rotation.z = -Math.sin(time * 2 - 0.85) * 0.25;
    ponyLinks.forEach((part, i) => {
      const lag = time * 2 - 1.05 - i * 0.38;
      const amount = 0.25 - i * 0.025;
      part.rotation.x = Math.sin(lag) * amount;
      part.rotation.z = -Math.sin(lag * 0.82) * amount * 0.72;
    });

    strands.forEach(({ strand, side, phase }) => {
      const lag = time * 2 - 0.85 - phase;
      strand.rotation.z = side * (0.1 + Math.sin(lag) * 0.07);
      strand.rotation.x = Math.sin(lag * 0.9) * 0.08;
    });

    /* Arms: stagger the joints so motion flows shoulder -> wrist -> fingers. */
    arms.forEach(({ shoulder, upperArm, elbow, forearm, wrist, hand, fingerGroups, thumb, side }) => {
      const phase = time + (side > 0 ? 0 : Math.PI);
      const wave = Math.sin(phase);
      const wave2 = Math.sin(phase * 2 - 0.35);
      const raised = wave * 0.5 + 0.5;

      shoulder.rotation.z = side * (0.10 + raised * 1.35);
      shoulder.rotation.x = Math.sin(phase * 2 - 0.4) * 0.26;
      shoulder.rotation.y = side * Math.sin(phase - 0.3) * 0.14;

      upperArm.rotation.z = -side * (0.12 + raised * 0.58);
      upperArm.rotation.x = wave2 * 0.18;

      // Elbow bend changes independently from the upper arm.
      elbow.rotation.z = side * (0.08 + Math.max(0, -wave) * 0.65);
      elbow.rotation.x = Math.sin(phase * 2 + 0.35) * 0.18;

      forearm.rotation.z = -side * (0.08 + Math.abs(wave2) * 0.46);
      forearm.rotation.x = Math.sin(phase * 2 + 0.75) * 0.20;

      wrist.rotation.z = -side * Math.sin(phase * 2 + 1.0) * 0.26;
      wrist.rotation.x = Math.sin(phase * 2 + 1.1) * 0.15;

      hand.rotation.z = -side * Math.sin(phase * 2 + 1.15) * 0.16;
      hand.rotation.x = Math.sin(phase * 2 + 1.3) * 0.10;

      const curl = Math.max(0, Math.sin(phase * 2 + 1.2)) * 0.34;
      fingerGroups.forEach((finger, index) => {
        finger.rotation.x = curl * (0.75 + index * 0.08);
        finger.rotation.z = side * Math.sin(phase * 2 + index * 0.17) * 0.035;
      });
      thumb.rotation.x = curl * 0.5;
      thumb.rotation.z = side * 0.16 + Math.sin(phase * 2) * 0.08;
    });

    /* Legs: one side supports while the other gets the expressive step. */
    legs.forEach(({ thigh, knee, shin, ankle, foot, side }) => {
      const phase = time * 2 + (side > 0 ? 0 : Math.PI);
      const swing = Math.sin(phase);
      const lift = Math.max(0, -swing);
      const supportAmount = Math.max(0, swing);

      thigh.rotation.x = swing * 0.24 - lift * 0.08;
      thigh.rotation.z = side * 0.025 + weight * side * 0.035;
      thigh.rotation.y = Math.sin(phase - 0.35) * 0.06;

      knee.rotation.z = side * lift * 0.07;
      shin.rotation.x = lift * 0.38 + supportAmount * 0.035;
      shin.rotation.z = -side * lift * 0.045;

      // Heel/toe articulation keeps the foot from behaving like a rigid block.
      ankle.rotation.x = -swing * 0.20 + lift * 0.28;
      ankle.rotation.z = -side * lift * 0.05;
      foot.rotation.x = -lift * 0.16 + supportAmount * 0.04;
    });

    // Blink. Scales the eye's own build height rather than assigning an
    // absolute value, and uses the collected list instead of traversing the
    // whole face every frame.
    const lid = 0.92 + Math.abs(Math.sin(time * 0.72)) * 0.06;
    eyeWhites.forEach(({ mesh, base }) => {
      mesh.scale.set(base.x, base.y * lid, base.z);
    });

    // Keep delta meaningfully used for future frame-rate-independent additions.
    void delta;
  };

  return {
    root,
    spinners: [],
    update,
    rest,
    frame: { camera: [5.8, 3.8, 8.6], target: [0, 1.9, 0] },
  };
}
