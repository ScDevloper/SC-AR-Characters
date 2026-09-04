import * as THREE from "three";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/**
 * The first non-machine character in the set, so it gets its own body rather
 * than a reskin of the robot humanoid.
 *
 * Two things carry the performance: the skirt flares outward with the spin
 * (centrifugal, not decorative), and the ponytail lags the head instead of
 * being welded to it. Secondary motion trailing the primary is most of what
 * separates a dancing figure from a rocking statue.
 */

// Single constant, easy to change: the stylised body tone.
const BODY_TONE = 0xf0d9c0;
const HAIR_TONE = 0x241a18;

export function buildDancer(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const skin = new THREE.MeshPhysicalMaterial({
    color: BODY_TONE,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.3,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xffe8d8),
    clearcoat: 0.15,
    envMapIntensity: 0.7,
  });
  // Fabric, not plastic: high sheen at a grazing angle is what reads as cloth.
  const dress = new THREE.MeshPhysicalMaterial({
    color: cyan.color.clone(),
    roughness: 0.74,
    metalness: 0,
    sheen: 0.9,
    sheenRoughness: 0.45,
    sheenColor: magenta.color.clone(),
    side: THREE.DoubleSide,
    envMapIntensity: 0.85,
  });
  const hair = new THREE.MeshPhysicalMaterial({
    color: HAIR_TONE,
    roughness: 0.42,
    metalness: 0,
    sheen: 0.7,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color(0x8a6a5a),
    clearcoat: 0.4,
    envMapIntensity: 0.9,
  });
  const trim = new THREE.MeshPhysicalMaterial({
    color: magenta.color.clone(),
    roughness: 0.5,
    metalness: 0.15,
    sheen: 0.5,
    envMapIntensity: 0.9,
  });

  /* ---- hips, torso, head ------------------------------------------- */

  const hips = new THREE.Group();
  hips.position.y = 1.52;
  root.add(hips);
  addMesh(hips, new THREE.CapsuleGeometry(0.29, 0.16, 8, 20), skin, [0, 0, 0]);

  const torso = new THREE.Group();
  torso.position.y = 0.12;
  hips.add(torso);
  const chest = addMesh(torso, new THREE.CapsuleGeometry(0.31, 0.48, 8, 22), skin, [0, 0.4, 0]);
  chest.scale.set(1, 1, 0.82);
  // Bodice.
  addMesh(torso, new THREE.CylinderGeometry(0.34, 0.31, 0.66, 26), dress, [0, 0.33, 0]).scale.set(1, 1, 0.84);
  addMesh(torso, new THREE.TorusGeometry(0.315, 0.035, 10, 28), trim, [0, 0.02, 0], [Math.PI / 2, 0, 0]);

  const neck = addMesh(torso, new THREE.CylinderGeometry(0.1, 0.12, 0.16, 14), skin, [0, 0.76, 0]);
  void neck;

  const head = new THREE.Group();
  head.position.y = 0.98;
  torso.add(head);
  const skull = addMesh(head, new THREE.SphereGeometry(0.32, 32, 24), skin, [0, 0, 0]);
  skull.scale.set(0.92, 1, 0.94);
  // Hair cap, swept back off the face.
  const cap = addMesh(head, new THREE.SphereGeometry(0.335, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, [0, 0.02, -0.02]);
  cap.scale.set(0.96, 1.02, 1);
  const eyes = addFace(head, palette, 0.62);
  eyes.position.set(0, 0.02, 0.3);

  // Ponytail: three linked segments, each lagging the one before it.
  const tail = new THREE.Group();
  tail.position.set(0, 0.12, -0.28);
  head.add(tail);
  addMesh(tail, new THREE.SphereGeometry(0.13, 18, 14), hair, [0, 0, 0]);
  const tailLinks: THREE.Group[] = [];
  let link: THREE.Object3D = tail;
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Group();
    seg.position.y = i === 0 ? -0.06 : -0.3;
    link.add(seg);
    addMesh(seg, new THREE.CapsuleGeometry(0.1 - i * 0.02, 0.22, 6, 14), hair, [0, -0.16, 0]);
    tailLinks.push(seg);
    link = seg;
  }

  /* ---- arms --------------------------------------------------------- */

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.34, 0.62, 0);
    torso.add(shoulder);
    addMesh(shoulder, new THREE.SphereGeometry(0.11, 16, 12), skin, [0, 0, 0]);
    addMesh(shoulder, new THREE.CapsuleGeometry(0.085, 0.34, 6, 14), skin, [0, -0.25, 0]);

    const forearm = new THREE.Group();
    forearm.position.y = -0.48;
    shoulder.add(forearm);
    addMesh(forearm, new THREE.CapsuleGeometry(0.072, 0.32, 6, 14), skin, [0, -0.22, 0]);
    addMesh(forearm, new THREE.SphereGeometry(0.082, 14, 12), skin, [0, -0.44, 0]);
    // Bangle, so the wrist reads at distance.
    addMesh(forearm, new THREE.TorusGeometry(0.085, 0.018, 8, 18), trim, [0, -0.36, 0], [Math.PI / 2, 0, 0]);

    return { shoulder, forearm, side };
  });

  /* ---- skirt -------------------------------------------------------- */

  const skirt = new THREE.Group();
  skirt.position.y = -0.04;
  hips.add(skirt);
  const skirtMesh = addMesh(
    skirt,
    new THREE.CylinderGeometry(0.36, 0.92, 0.86, 36, 1, true),
    dress,
    [0, -0.4, 0],
  );
  addMesh(skirt, new THREE.TorusGeometry(0.9, 0.03, 10, 40), trim, [0, -0.82, 0], [Math.PI / 2, 0, 0]);

  /* ---- legs --------------------------------------------------------- */

  const legs = [-1, 1].map((side) => {
    const upper = new THREE.Group();
    upper.position.set(side * 0.15, -0.18, 0);
    hips.add(upper);
    addMesh(upper, new THREE.CapsuleGeometry(0.105, 0.5, 6, 16), skin, [0, -0.34, 0]);

    const lower = new THREE.Group();
    lower.position.y = -0.68;
    upper.add(lower);
    addMesh(lower, new THREE.CapsuleGeometry(0.085, 0.46, 6, 16), skin, [0, -0.3, 0]);
    // Shoe.
    addMesh(lower, new THREE.CapsuleGeometry(0.09, 0.12, 6, 14), trim, [0, -0.62, 0.04], [Math.PI / 2.4, 0, 0]);

    return { upper, lower, side };
  });

  /* ---- animation ---------------------------------------------------- */

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    hips.position.y = 1.52;
    hips.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    tail.rotation.set(0, 0, 0);
    tailLinks.forEach((seg) => seg.rotation.set(0, 0, 0));
    skirt.rotation.set(0, 0, 0);
    skirt.scale.set(1, 1, 1);
    skirtMesh.rotation.set(0, 0, 0);
    arms.forEach(({ shoulder, forearm, side }) => {
      shoulder.rotation.set(0, 0, side * 0.16);
      forearm.rotation.set(0, 0, 0);
    });
    legs.forEach(({ upper, lower }) => {
      upper.rotation.set(0, 0, 0);
      lower.rotation.set(0, 0, 0);
    });
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const sway = Math.sin(beat);
    const step = Math.sin(beat * 2);
    const spin = Math.sin(beat * 0.5);

    // Weight shifts side to side, hips lead and shoulders follow.
    root.rotation.y = spin * 0.8;
    hips.position.y = 1.52 + Math.abs(step) * 0.09;
    hips.rotation.z = sway * 0.14;
    hips.rotation.y = sway * 0.22;
    torso.rotation.z = -sway * 0.1;
    torso.rotation.y = -sway * 0.3;

    head.rotation.z = step * 0.1;
    head.rotation.y = sway * 0.35;
    head.rotation.x = -step * 0.06;

    // Skirt flares with how fast she is turning, not on a fixed cycle.
    const turnRate = Math.abs(Math.cos(beat * 0.5)) * 0.5 + Math.abs(sway) * 0.5;
    const flare = 1 + turnRate * 0.34;
    skirt.scale.set(flare, 1 - turnRate * 0.08, flare);
    skirt.rotation.y = -sway * 0.4;          // fabric trails the hips
    skirtMesh.rotation.z = sway * 0.07;

    // Ponytail: each link lags the one above, so the whip travels down it.
    tail.rotation.x = 0.25 + step * 0.3;
    tail.rotation.z = -sway * 0.4;
    tailLinks.forEach((seg, i) => {
      const lag = beat * 2 - (i + 1) * 0.7;
      seg.rotation.x = Math.sin(lag) * 0.32;
      seg.rotation.z = -Math.sin(lag * 0.5) * 0.28;
    });

    arms.forEach(({ shoulder, forearm, side }) => {
      // One arm up, one out, swapping on the beat.
      const phase = side > 0 ? beat : beat + Math.PI;
      shoulder.rotation.z = side * (0.16 + (Math.sin(phase) * 0.5 + 0.5) * 2.1);
      shoulder.rotation.x = Math.sin(phase * 2) * 0.45;
      forearm.rotation.z = -side * (0.2 + Math.abs(Math.sin(phase * 2)) * 0.7);
      forearm.rotation.x = Math.sin(phase * 2 + 0.6) * 0.3;
    });

    legs.forEach(({ upper, lower, side }) => {
      const phase = side > 0 ? beat : beat + Math.PI;
      upper.rotation.x = Math.sin(phase) * 0.34;
      upper.rotation.z = side * 0.06 + sway * 0.05;
      lower.rotation.x = Math.max(0, -Math.sin(phase)) * 0.5;
    });

    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat * 0.6)) * 0.45;
  };

  return {
    root,
    spinners: [],
    update,
    rest,
    frame: { camera: [6.0, 3.8, 8.8], target: [0, 1.9, 0] },
  };
}
