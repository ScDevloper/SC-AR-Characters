import * as THREE from "three";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/**
 * The only non-machine character in the set, so it gets its own body.
 *
 * What makes a figure read as real in motion is joint count and secondary
 * motion, not polygon count. This build carries an articulated spine
 * (hips -> waist -> chest -> neck), hands with curling fingers, ankles that
 * roll heel-to-toe, a two-layer skirt whose panels flare at different rates,
 * and hair that trails the head instead of being welded to it.
 */

// Single constants, easy to change.
const BODY_TONE = 0xf0d9c0;
const HAIR_TONE = 0x241a18;

/** Tapered limb profile - smoother than a capsule, still cheap. */
function limbGeometry(top: number, mid: number, bottom: number, length: number) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    // Widest around a third down, like a real muscle belly.
    const bulge = Math.sin(t * Math.PI) * 0.5 + 0.5;
    const radius = THREE.MathUtils.lerp(top, bottom, t) * (0.86 + bulge * 0.14 * (mid / top));
    points.push(new THREE.Vector2(Math.max(radius, 0.012), -t * length));
  }
  return new THREE.LatheGeometry(points, 18);
}

export function buildDancer(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const skin = new THREE.MeshPhysicalMaterial({
    color: BODY_TONE,
    roughness: 0.58,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color(0xffe8d8),
    clearcoat: 0.18,
    clearcoatRoughness: 0.6,
    envMapIntensity: 0.75,
  });
  // Fabric: high sheen at grazing angles is what separates cloth from plastic.
  const dress = new THREE.MeshPhysicalMaterial({
    color: cyan.color.clone(),
    roughness: 0.76,
    metalness: 0,
    sheen: 0.95,
    sheenRoughness: 0.4,
    sheenColor: magenta.color.clone(),
    side: THREE.DoubleSide,
    envMapIntensity: 0.9,
  });
  const underskirt = dress.clone();
  underskirt.color = magenta.color.clone();
  underskirt.sheenColor = cyan.color.clone();
  const hair = new THREE.MeshPhysicalMaterial({
    color: HAIR_TONE,
    roughness: 0.38,
    metalness: 0,
    sheen: 0.8,
    sheenRoughness: 0.28,
    sheenColor: new THREE.Color(0x8a6a5a),
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.95,
  });
  const trim = new THREE.MeshPhysicalMaterial({
    color: magenta.color.clone(),
    roughness: 0.45,
    metalness: 0.2,
    sheen: 0.5,
    envMapIntensity: 1.0,
  });
  const feature = new THREE.MeshPhysicalMaterial({
    color: 0xb8705f,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  /* ---- spine: four joints instead of one rigid torso ---------------- */

  const hips = new THREE.Group();
  hips.position.y = 1.10;
  root.add(hips);
  addMesh(hips, limbGeometry(0.3, 0.31, 0.26, 0.3), skin, [0, 0.15, 0]);

  const waist = new THREE.Group();
  waist.position.y = 0.16;
  hips.add(waist);
  addMesh(waist, limbGeometry(0.24, 0.25, 0.28, 0.3), skin, [0, 0.3, 0]);

  const chest = new THREE.Group();
  chest.position.y = 0.32;
  waist.add(chest);
  const ribs = addMesh(chest, limbGeometry(0.32, 0.33, 0.26, 0.46), skin, [0, 0.46, 0]);
  ribs.scale.set(1, 1, 0.84);
  // Bodice over the chest, with a belt at the waist seam.
  const bodice = addMesh(chest, new THREE.CylinderGeometry(0.335, 0.3, 0.62, 28), dress, [0, 0.2, 0]);
  bodice.scale.set(1, 1, 0.86);
  addMesh(chest, new THREE.TorusGeometry(0.31, 0.032, 10, 30), trim, [0, -0.1, 0], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    addMesh(chest, new THREE.CylinderGeometry(0.022, 0.022, 0.34, 8), dress, [side * 0.17, 0.5, -0.02], [0.1, 0, side * 0.12]);
  }

  const neck = new THREE.Group();
  neck.position.y = 0.62;
  chest.add(neck);
  addMesh(neck, limbGeometry(0.098, 0.1, 0.11, 0.18), skin, [0, 0.09, 0]);

  /* ---- head, face, hair --------------------------------------------- */

  const head = new THREE.Group();
  head.position.y = 0.2;
  neck.add(head);
  const skull = addMesh(head, new THREE.SphereGeometry(0.3, 36, 28), skin, [0, 0.16, 0]);
  skull.scale.set(0.92, 1.02, 0.95);
  // Jaw taper, so the head is not a plain ball.
  const jaw = addMesh(head, new THREE.SphereGeometry(0.24, 28, 20), skin, [0, 0.02, 0.03]);
  jaw.scale.set(0.9, 0.85, 0.95);

  addMesh(head, new THREE.ConeGeometry(0.032, 0.075, 12), skin, [0, 0.15, 0.28], [Math.PI / 2.1, 0, 0]);
  addMesh(head, new THREE.SphereGeometry(0.045, 14, 10), feature, [0, 0.03, 0.26]).scale.set(1.5, 0.7, 0.6);
  for (const side of [-1, 1]) {
    addMesh(head, new THREE.BoxGeometry(0.1, 0.016, 0.02), skin, [side * 0.11, 0.29, 0.25], [0, 0, side * 0.12]);
    addMesh(head, new THREE.SphereGeometry(0.05, 12, 10), skin, [side * 0.29, 0.14, 0.01]).scale.set(0.5, 1, 0.8);
  }

  const eyes = addFace(head, palette, 0.56);
  eyes.position.set(0, 0.2, 0.27);

  const cap = addMesh(head, new THREE.SphereGeometry(0.315, 34, 26, 0, Math.PI * 2, 0, Math.PI * 0.6), hair, [0, 0.17, -0.025]);
  cap.scale.set(0.97, 1.04, 1.02);
  // Framing strands down each side of the face.
  const strands = [-1, 1].map((side) => {
    const strand = new THREE.Group();
    strand.position.set(side * 0.24, 0.34, 0.08);
    head.add(strand);
    addMesh(strand, limbGeometry(0.05, 0.055, 0.02, 0.42), hair, [0, 0, 0], [0.1, 0, side * 0.12]);
    return { strand, side };
  });

  const tail = new THREE.Group();
  tail.position.set(0, 0.28, -0.24);
  head.add(tail);
  addMesh(tail, new THREE.SphereGeometry(0.12, 20, 16), hair, [0, 0, 0]);
  addMesh(tail, new THREE.TorusGeometry(0.11, 0.022, 8, 20), trim, [0, 0.01, 0], [Math.PI / 2, 0, 0]);
  const tailLinks: THREE.Group[] = [];
  let link: THREE.Object3D = tail;
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Group();
    seg.position.y = i === 0 ? -0.05 : -0.26;
    link.add(seg);
    addMesh(seg, limbGeometry(0.095 - i * 0.016, 0.1 - i * 0.016, 0.07 - i * 0.014, 0.28), hair, [0, 0, 0]);
    tailLinks.push(seg);
    link = seg;
  }

  /* ---- arms, with hands that curl ------------------------------------ */

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.31, 0.52, 0);
    chest.add(shoulder);
    addMesh(shoulder, new THREE.SphereGeometry(0.105, 18, 14), skin, [0, 0, 0]);
    addMesh(shoulder, limbGeometry(0.088, 0.095, 0.072, 0.44), skin, [0, -0.02, 0]);

    const forearm = new THREE.Group();
    forearm.position.y = -0.46;
    shoulder.add(forearm);
    addMesh(forearm, new THREE.SphereGeometry(0.075, 14, 12), skin, [0, 0, 0]);
    addMesh(forearm, limbGeometry(0.072, 0.078, 0.052, 0.4), skin, [0, -0.01, 0]);
    addMesh(forearm, new THREE.TorusGeometry(0.062, 0.016, 8, 18), trim, [0, -0.35, 0], [Math.PI / 2, 0, 0]);

    const hand = new THREE.Group();
    hand.position.y = -0.42;
    forearm.add(hand);
    const palm = addMesh(hand, new THREE.BoxGeometry(0.075, 0.1, 0.038), skin, [0, -0.05, 0]);
    palm.geometry.translate(0, 0, 0);
    // Four fingers plus a thumb, curling as a group.
    const fingers = new THREE.Group();
    fingers.position.y = -0.1;
    hand.add(fingers);
    for (let f = 0; f < 4; f++) {
      addMesh(fingers, limbGeometry(0.014, 0.015, 0.01, 0.085), skin, [(f - 1.5) * 0.021, 0, 0]);
    }
    const thumb = new THREE.Group();
    thumb.position.set(side * 0.04, -0.04, 0.01);
    hand.add(thumb);
    addMesh(thumb, limbGeometry(0.016, 0.017, 0.012, 0.06), skin, [0, 0, 0], [0, 0, side * 0.9]);

    return { shoulder, forearm, hand, fingers, thumb, side };
  });

  /* ---- two-layer skirt ----------------------------------------------- */

  const skirtProfile = (topR: number, hemR: number, drop: number) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      // Eased flare: hangs close at the waist, opens toward the hem.
      pts.push(new THREE.Vector2(THREE.MathUtils.lerp(topR, hemR, t * t * 0.7 + t * 0.3), -t * drop));
    }
    return new THREE.LatheGeometry(pts, 40);
  };

  const skirt = new THREE.Group();
  skirt.position.y = 0.06;
  hips.add(skirt);
  const outerPanel = addMesh(skirt, skirtProfile(0.33, 0.96, 0.95), dress, [0, 0, 0]);
  const innerPanel = addMesh(skirt, skirtProfile(0.31, 0.72, 0.7), underskirt, [0, -0.01, 0]);
  addMesh(skirt, new THREE.TorusGeometry(0.955, 0.028, 10, 44), trim, [0, -0.95, 0], [Math.PI / 2, 0, 0]);

  /* ---- legs, with ankles that roll ------------------------------------ */

  const legs = [-1, 1].map((side) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * 0.14, -0.05, 0);
    hips.add(thigh);
    addMesh(thigh, limbGeometry(0.115, 0.125, 0.085, 0.6), skin, [0, 0, 0]);

    const shin = new THREE.Group();
    shin.position.y = -0.62;
    thigh.add(shin);
    addMesh(shin, new THREE.SphereGeometry(0.082, 14, 12), skin, [0, 0, 0]);
    addMesh(shin, limbGeometry(0.082, 0.095, 0.05, 0.56), skin, [0, 0, 0]);

    const ankle = new THREE.Group();
    ankle.position.y = -0.58;
    shin.add(ankle);
    addMesh(ankle, new THREE.SphereGeometry(0.05, 12, 10), skin, [0, 0, 0]);
    addMesh(ankle, new THREE.BoxGeometry(0.085, 0.05, 0.2), trim, [0, -0.04, 0.05]);
    addMesh(ankle, new THREE.BoxGeometry(0.07, 0.09, 0.05), trim, [0, -0.03, -0.05]);

    return { thigh, shin, ankle, side };
  });

  /* ---- animation ------------------------------------------------------ */

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    hips.position.y = 1.10;
    hips.rotation.set(0, 0, 0);
    waist.rotation.set(0, 0, 0);
    chest.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    tail.rotation.set(0, 0, 0);
    tailLinks.forEach((seg) => seg.rotation.set(0, 0, 0));
    strands.forEach(({ strand, side }) => strand.rotation.set(0, 0, side * 0.1));
    skirt.rotation.set(0, 0, 0);
    skirt.scale.set(1, 1, 1);
    outerPanel.rotation.set(0, 0, 0);
    innerPanel.rotation.set(0, 0, 0);
    arms.forEach(({ shoulder, forearm, hand, fingers, thumb, side }) => {
      shoulder.rotation.set(0, 0, side * 0.16);
      forearm.rotation.set(0, 0, 0);
      hand.rotation.set(0, 0, 0);
      fingers.rotation.set(0, 0, 0);
      thumb.rotation.set(0, 0, 0);
    });
    legs.forEach(({ thigh, shin, ankle }) => {
      thigh.rotation.set(0, 0, 0);
      shin.rotation.set(0, 0, 0);
      ankle.rotation.set(0, 0, 0);
    });
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const sway = Math.sin(beat);
    const step = Math.sin(beat * 2);
    const spin = Math.sin(beat * 0.5);

    root.rotation.y = spin * 0.85;

    // Twist travels up the spine: each joint lags the one below it, which is
    // what stops the torso reading as a single rigid block.
    hips.position.y = 1.10 + Math.abs(step) * 0.085;
    hips.rotation.z = sway * 0.13;
    hips.rotation.y = sway * 0.24;
    waist.rotation.z = -sway * 0.07;
    waist.rotation.y = -Math.sin(beat - 0.35) * 0.2;
    chest.rotation.z = -Math.sin(beat - 0.5) * 0.11;
    chest.rotation.y = -Math.sin(beat - 0.7) * 0.26;
    chest.rotation.x = step * 0.05;

    neck.rotation.z = Math.sin(beat - 0.9) * 0.09;
    head.rotation.z = step * 0.1;
    head.rotation.y = Math.sin(beat - 1.0) * 0.34;
    head.rotation.x = -step * 0.07;

    // Skirt flares with how fast she is actually turning.
    const turnRate = Math.abs(Math.cos(beat * 0.5)) * 0.55 + Math.abs(sway) * 0.45;
    skirt.scale.set(1 + turnRate * 0.3, 1 - turnRate * 0.07, 1 + turnRate * 0.3);
    skirt.rotation.y = -sway * 0.42;
    // Layers lag by different amounts, so they separate as she spins.
    outerPanel.rotation.z = sway * 0.075;
    outerPanel.rotation.x = Math.sin(beat - 0.4) * 0.05;
    innerPanel.rotation.z = Math.sin(beat - 0.6) * 0.05;

    tail.rotation.x = 0.22 + step * 0.28;
    tail.rotation.z = -sway * 0.38;
    tailLinks.forEach((seg, i) => {
      const lag = beat * 2 - (i + 1) * 0.65;
      seg.rotation.x = Math.sin(lag) * 0.3;
      seg.rotation.z = -Math.sin(lag * 0.5) * 0.26;
    });
    strands.forEach(({ strand, side }) => {
      strand.rotation.z = side * 0.1 + Math.sin(beat * 2 - 0.4) * 0.16;
      strand.rotation.x = Math.sin(beat * 2) * 0.12;
    });

    arms.forEach(({ shoulder, forearm, hand, fingers, thumb, side }) => {
      const phase = side > 0 ? beat : beat + Math.PI;
      const raise = Math.sin(phase) * 0.5 + 0.5;
      shoulder.rotation.z = side * (0.16 + raise * 2.05);
      shoulder.rotation.x = Math.sin(phase * 2) * 0.42;
      forearm.rotation.z = -side * (0.2 + Math.abs(Math.sin(phase * 2)) * 0.66);
      forearm.rotation.x = Math.sin(phase * 2 + 0.6) * 0.28;
      // Wrist leads, fingers follow a beat later.
      hand.rotation.z = -side * Math.sin(phase * 2 + 0.9) * 0.4;
      hand.rotation.x = Math.sin(phase * 2 + 1.1) * 0.25;
      const curl = (Math.sin(phase * 2 + 1.4) * 0.5 + 0.5) * 0.7;
      fingers.rotation.x = curl;
      thumb.rotation.x = curl * 0.5;
    });

    legs.forEach(({ thigh, shin, ankle, side }) => {
      const phase = side > 0 ? beat : beat + Math.PI;
      const swing = Math.sin(phase);
      thigh.rotation.x = swing * 0.36;
      thigh.rotation.z = side * 0.05 + sway * 0.05;
      shin.rotation.x = Math.max(0, -swing) * 0.52;
      // Heel-to-toe roll: the foot stays level while the leg swings under it.
      ankle.rotation.x = -swing * 0.3 + Math.max(0, -swing) * 0.25;
    });

    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat * 0.6)) * 0.45;
  };

  return {
    root,
    spinners: [],
    update,
    rest,
    frame: { camera: [5.8, 3.8, 8.6], target: [0, 1.9, 0] },
  };
}
