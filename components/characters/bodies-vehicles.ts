import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/**
 * One body per character - nothing in here is shared. Each build returns the
 * usual rig contract, and every `rest()` restores exactly what its `update()`
 * touches; a mismatch shows up as the model creeping out of place each time
 * the reset button is pressed.
 */

/* ---------------------------------------------------- 1. Truck --------- */

export function buildTruck(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, magenta } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const body = new THREE.Group();
  body.position.y = 1.0;
  root.add(body);

  // Box trailer with a roller shutter, cab up front.
  addMesh(body, new RoundedBoxGeometry(3.0, 1.7, 1.6, 5, 0.12), paper, [-0.55, 0.25, 0]);
  addMesh(body, new RoundedBoxGeometry(0.1, 1.4, 1.4, 3, 0.05), darkMetal, [-2.02, 0.2, 0]);
  addMesh(body, new RoundedBoxGeometry(3.02, 0.26, 1.62, 3, 0.06), cyan, [-0.55, -0.3, 0]);

  const cab = new THREE.Group();
  cab.position.set(1.5, 0.05, 0);
  body.add(cab);
  addMesh(cab, new RoundedBoxGeometry(1.3, 1.4, 1.55, 5, 0.18), metal, [0, 0, 0]);
  addMesh(cab, new RoundedBoxGeometry(0.12, 0.66, 1.3, 3, 0.1), screen, [0.62, 0.24, 0]);
  addMesh(cab, new RoundedBoxGeometry(0.3, 0.2, 1.4, 2, 0.05), magenta, [0.5, -0.55, 0]);
  const eyes = addFace(cab, palette, 0.78);
  eyes.rotation.y = Math.PI / 2;
  eyes.position.set(0.7, 0.24, 0);

  const wheels: THREE.Mesh[] = [];
  for (const x of [1.42, -0.5, -1.5]) {
    for (const z of [-0.82, 0.82]) {
      wheels.push(
        addMesh(body, new THREE.CylinderGeometry(0.42, 0.42, 0.3, 22), rubber, [x, -0.78, z], [0, 0, Math.PI / 2]),
      );
      addMesh(body, new THREE.CylinderGeometry(0.19, 0.19, 0.34, 14), metal, [x, -0.78, z], [0, 0, Math.PI / 2]);
    }
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    body.position.set(0, 1.0, 0);
    body.rotation.set(0, 0, 0);
    cab.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const bounce = Math.abs(Math.sin(beat * 2));
    body.position.y = 1.0 + bounce * 0.11;
    body.rotation.z = Math.sin(beat) * 0.06;      // suspension roll
    body.rotation.x = Math.sin(beat * 2) * 0.03;
    cab.rotation.z = Math.sin(beat * 2 + 0.5) * 0.07;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.6)) * 0.35;
  };

  return {
    root,
    spinners: wheels.map((part) => ({ part, axis: "x" as const, speed: 3.0 })),
    update,
    rest,
    frame: { camera: [6.4, 3.4, 9.2], target: [0, 1.2, 0] },
  };
}

/* ---------------------------------------------------- 2. Pallet -------- */

export function buildPalletTrolley(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, paper, cyan, magenta, yellow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const frame = new THREE.Group();
  frame.position.y = 0.5;
  root.add(frame);

  // Fork legs and the pallet resting on them.
  for (const z of [-0.5, 0.5]) {
    addMesh(frame, new RoundedBoxGeometry(2.5, 0.16, 0.34, 3, 0.05), yellow, [0, 0, z]);
  }
  const pallet = new THREE.Group();
  pallet.position.y = 0.22;
  frame.add(pallet);
  for (const z of [-0.62, 0, 0.62]) {
    addMesh(pallet, new RoundedBoxGeometry(2.4, 0.12, 0.3, 3, 0.03), darkMetal, [0, 0, z]);
  }
  addMesh(pallet, new RoundedBoxGeometry(2.4, 0.09, 1.7, 3, 0.03), darkMetal, [0, 0.11, 0]);

  const cartons: THREE.Mesh[] = [];
  const spots: [number, number, number][] = [
    [-0.65, 0.45, -0.36], [0.05, 0.45, -0.36], [0.72, 0.45, -0.36],
    [-0.65, 0.45, 0.4], [0.05, 0.45, 0.4], [0.72, 0.45, 0.4],
    [-0.3, 1.05, 0], [0.42, 1.05, 0],
  ];
  spots.forEach((spot, i) => {
    cartons.push(addMesh(pallet, new RoundedBoxGeometry(0.62, 0.56, 0.62, 4, 0.05), paper, spot));
    addMesh(pallet, new RoundedBoxGeometry(0.64, 0.1, 0.64, 2, 0.02),
      i % 2 === 0 ? cyan : magenta, [spot[0], spot[1] + 0.16, spot[2]]);
  });

  // Tiller handle carries the face.
  const handle = new THREE.Group();
  handle.position.set(-1.35, 0.1, 0);
  frame.add(handle);
  addMesh(handle, new RoundedBoxGeometry(0.22, 1.9, 0.22, 3, 0.07), metal, [0, 0.95, 0], [0, 0, 0.22]);
  const head = new THREE.Group();
  head.position.set(-0.42, 1.9, 0);
  handle.add(head);
  addMesh(head, new RoundedBoxGeometry(0.9, 0.62, 0.7, 5, 0.16), darkMetal, [0, 0, 0]);
  addMesh(head, new THREE.CylinderGeometry(0.09, 0.09, 1.0, 12), rubber, [0, 0.1, 0], [Math.PI / 2, 0, 0]);
  const eyes = addFace(head, palette, 0.62);
  eyes.rotation.y = -Math.PI / 2;
  eyes.position.x = -0.48;

  const wheels: THREE.Mesh[] = [];
  for (const [x, z] of [[1.1, -0.5], [1.1, 0.5], [-1.15, -0.34], [-1.15, 0.34]] as [number, number][]) {
    wheels.push(addMesh(frame, new THREE.CylinderGeometry(0.22, 0.22, 0.16, 18), rubber, [x, -0.2, z], [0, 0, Math.PI / 2]));
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    frame.position.set(0, 0.5, 0);
    frame.rotation.set(0, 0, 0);
    handle.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    cartons.forEach((box, i) => box.position.set(spots[i][0], spots[i][1], spots[i][2]));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const rock = Math.sin(beat);
    frame.position.y = 0.5 + Math.abs(Math.sin(beat * 2)) * 0.14;
    frame.rotation.z = rock * 0.07;
    handle.rotation.z = -0.25 + Math.sin(beat * 1.5) * 0.3;   // pumping the tiller
    head.rotation.z = Math.sin(beat * 2) * 0.16;
    cartons.forEach((box, i) => {
      box.position.y = spots[i][1] + Math.sin(beat * 2 - i * 0.5) * 0.035;
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.7)) * 0.35;
  };

  return {
    root,
    spinners: wheels.map((part) => ({ part, axis: "x" as const, speed: 2.6 })),
    update,
    rest,
    frame: { camera: [6.2, 3.4, 8.8], target: [0, 1.3, 0] },
  };
}

/* ---------------------------------------------------- 3. Forklift ------ */

export function buildForklift(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, yellow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const chassis = new THREE.Group();
  chassis.position.y = 0.72;
  root.add(chassis);
  addMesh(chassis, new RoundedBoxGeometry(2.0, 0.9, 1.4, 5, 0.14), yellow, [-0.3, 0, 0]);
  addMesh(chassis, new RoundedBoxGeometry(1.0, 0.7, 1.2, 4, 0.12), darkMetal, [-1.0, 0.6, 0]);

  // Overhead guard, which doubles as the character's cap.
  for (const [x, z] of [[-0.45, -0.55], [-0.45, 0.55], [-1.35, -0.55], [-1.35, 0.55]] as [number, number][]) {
    addMesh(chassis, new THREE.CylinderGeometry(0.06, 0.06, 1.5, 10), metal, [x, 1.15, z]);
  }
  addMesh(chassis, new RoundedBoxGeometry(1.3, 0.1, 1.4, 3, 0.04), metal, [-0.9, 1.9, 0]);

  const cab = new THREE.Group();
  cab.position.set(-0.4, 0.75, 0);
  chassis.add(cab);
  addMesh(cab, new RoundedBoxGeometry(0.72, 0.66, 1.0, 5, 0.16), darkMetal, [0, 0, 0]);
  addMesh(cab, new RoundedBoxGeometry(0.1, 0.44, 0.8, 3, 0.08), screen, [0.36, 0.06, 0]);
  const eyes = addFace(cab, palette, 0.6);
  eyes.rotation.y = Math.PI / 2;
  eyes.position.x = 0.42;

  // Mast and forks, carrying a reel.
  const mast = new THREE.Group();
  mast.position.set(0.85, -0.2, 0);
  chassis.add(mast);
  for (const z of [-0.42, 0.42]) {
    addMesh(mast, new RoundedBoxGeometry(0.16, 2.6, 0.16, 3, 0.05), metal, [0, 1.2, z]);
  }
  const carriage = new THREE.Group();
  carriage.position.y = 0.2;
  mast.add(carriage);
  addMesh(carriage, new RoundedBoxGeometry(0.12, 0.5, 1.0, 3, 0.04), darkMetal, [0, 0, 0]);
  for (const z of [-0.32, 0.32]) {
    addMesh(carriage, new RoundedBoxGeometry(1.1, 0.1, 0.18, 2, 0.03), metal, [0.55, -0.22, z]);
  }
  const reel = addMesh(carriage, new THREE.CylinderGeometry(0.5, 0.5, 0.9, 30), paper, [0.6, 0.3, 0], [Math.PI / 2, 0, 0]);
  addMesh(carriage, new THREE.TorusGeometry(0.5, 0.05, 10, 30), cyan, [0.6, 0.3, 0.46], [0, 0, 0]);

  const wheels: THREE.Mesh[] = [];
  for (const [x, z, r] of [[0.5, -0.7, 0.4], [0.5, 0.7, 0.4], [-1.2, -0.5, 0.3], [-1.2, 0.5, 0.3]] as [number, number, number][]) {
    wheels.push(addMesh(chassis, new THREE.CylinderGeometry(r, r, 0.28, 20), rubber, [x, -0.42, z], [0, 0, Math.PI / 2]));
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    chassis.rotation.set(0, 0, 0);
    mast.rotation.set(0, 0, 0);
    carriage.position.y = 0.2;
    cab.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const lift = (Math.sin(beat) + 1) / 2;
    chassis.rotation.z = Math.sin(beat) * 0.05;
    mast.rotation.z = -0.06 + Math.sin(beat * 0.5) * 0.07;   // mast tilt
    carriage.position.y = 0.2 + lift * 1.5;                   // hoist the reel
    cab.rotation.y = Math.sin(beat * 0.6) * 0.3;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.8)) * 0.35;
  };

  return {
    root,
    spinners: [
      ...wheels.map((part) => ({ part, axis: "x" as const, speed: 2.2 })),
      { part: reel, axis: "y" as const, speed: 1.6 },
    ],
    update,
    rest,
    frame: { camera: [6.4, 3.8, 9.0], target: [0, 1.5, 0] },
  };
}

/* ---------------------------------------------------- 4. Cutter -------- */

export function buildCutter(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, magenta } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const base = new THREE.Group();
  base.position.y = 0.85;
  root.add(base);
  addMesh(base, new RoundedBoxGeometry(2.8, 1.5, 2.0, 5, 0.16), metal, [0, 0, 0]);
  addMesh(base, new RoundedBoxGeometry(2.5, 0.12, 1.7, 3, 0.04), paper, [0, 0.8, 0]);
  addMesh(base, new RoundedBoxGeometry(2.85, 0.2, 2.05, 3, 0.05), cyan, [0, -0.6, 0]);

  // The platen: an upper jaw that chomps down on the sheet.
  const jaw = new THREE.Group();
  jaw.position.y = 1.9;
  root.add(jaw);
  addMesh(jaw, new RoundedBoxGeometry(2.7, 0.9, 1.9, 5, 0.16), darkMetal, [0, 0, 0]);
  // Cutting rules on the underside.
  for (const x of [-0.8, 0, 0.8]) {
    addMesh(jaw, new RoundedBoxGeometry(0.06, 0.24, 1.5, 2, 0.02), magenta, [x, -0.5, 0]);
  }
  for (const side of [-1, 1]) {
    addMesh(jaw, new THREE.CylinderGeometry(0.13, 0.13, 1.3, 14), metal, [side * 1.5, -0.4, 0]);
  }

  const head = new THREE.Group();
  head.position.set(0, 0.75, 0.5);
  jaw.add(head);
  addMesh(head, new RoundedBoxGeometry(1.4, 0.72, 0.4, 5, 0.14), metal, [0, 0, 0], [-0.2, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(1.14, 0.5, 0.1, 4, 0.1), screen, [0, 0, 0.22], [-0.2, 0, 0]);
  const eyes = addFace(head, palette, 0.72);
  eyes.position.set(0, 0.02, 0.27);
  eyes.rotation.x = -0.2;

  const scrap = addMesh(base, new RoundedBoxGeometry(0.5, 0.02, 0.4, 2, 0.01), paper, [1.6, 0.5, 0], [0, 0.3, 0]);
  addMesh(base, new RoundedBoxGeometry(0.8, 0.4, 1.4, 3, 0.06), rubber, [1.7, -0.4, 0]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    base.rotation.set(0, 0, 0);
    jaw.position.set(0, 1.9, 0);
    jaw.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    scrap.position.set(1.6, 0.5, 0);
    scrap.rotation.set(0, 0.3, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    // Sharp chomp on the beat, slow recovery - a press, not a wobble.
    const cycle = (Math.sin(beat) + 1) / 2;
    const chomp = Math.pow(cycle, 4);
    jaw.position.y = 1.9 - chomp * 0.55;
    jaw.rotation.z = Math.sin(beat * 0.5) * 0.03;
    base.rotation.z = -chomp * 0.02;
    head.rotation.z = Math.sin(beat * 2) * 0.1;
    scrap.position.x = 1.6 + ((beat * 0.4) % 1) * 0.7;
    scrap.rotation.z = ((beat * 0.4) % 1) * 1.2;
    eyes.scale.y = 1 - chomp * 0.55;             // squints as it bites
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.4, 3.8, 9.0], target: [0, 1.6, 0] } };
}

/* ---------------------------------------------------- 5. Mixer --------- */

export function buildMixer(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, cyan, magenta, yellow, inkBlack, glow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  addMesh(root, new THREE.CylinderGeometry(1.1, 1.3, 0.34, 28), darkMetal, [0, 0.1, 0]);

  const vat = new THREE.Group();
  vat.position.y = 1.5;
  root.add(vat);
  addMesh(vat, new THREE.CylinderGeometry(1.15, 0.95, 1.9, 36, 1, true), metal, [0, 0, 0]);
  addMesh(vat, new THREE.TorusGeometry(1.15, 0.08, 12, 40), darkMetal, [0, 0.95, 0], [Math.PI / 2, 0, 0]);

  // Ink surface, which tilts and swirls.
  const surface = addMesh(vat, new THREE.CircleGeometry(1.1, 40), magenta, [0, 0.72, 0], [-Math.PI / 2, 0, 0]);
  const swirl = addMesh(vat, new THREE.TorusGeometry(0.55, 0.13, 12, 32), cyan, [0, 0.74, 0], [-Math.PI / 2, 0, 0]);

  // Paddle on a shaft down the middle.
  const paddle = new THREE.Group();
  paddle.position.y = 0.4;
  vat.add(paddle);
  addMesh(paddle, new THREE.CylinderGeometry(0.09, 0.09, 2.2, 14), metal, [0, 0.5, 0]);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    addMesh(paddle, new RoundedBoxGeometry(0.72, 0.3, 0.1, 3, 0.03), darkMetal,
      [Math.cos(angle) * 0.42, -0.35, Math.sin(angle) * 0.42], [0, -angle, 0.3]);
  }

  // Ink drums around the base, one per process colour.
  [cyan, magenta, yellow, inkBlack].forEach((ink, i) => {
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    addMesh(root, new THREE.CylinderGeometry(0.28, 0.28, 0.62, 18), ink,
      [Math.cos(angle) * 1.7, 0.42, Math.sin(angle) * 1.7]);
  });

  const head = new THREE.Group();
  head.position.set(0, 1.35, 1.05);
  vat.add(head);
  addMesh(head, new RoundedBoxGeometry(1.1, 0.66, 0.34, 5, 0.14), darkMetal, [0, 0, 0], [-0.3, 0, 0]);
  const eyes = addFace(head, palette, 0.66);
  eyes.position.z = 0.2;
  eyes.rotation.x = -0.3;
  addMesh(head, new THREE.SphereGeometry(0.07, 12, 10), glow, [0, 0.42, 0]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    vat.rotation.set(0, 0, 0);
    surface.position.y = 0.72;
    surface.rotation.set(-Math.PI / 2, 0, 0);
    swirl.scale.setScalar(1);
    swirl.position.y = 0.74;
    head.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const slosh = Math.sin(beat);
    vat.rotation.z = slosh * 0.07;
    vat.rotation.x = Math.cos(beat) * 0.05;
    surface.position.y = 0.72 + Math.sin(beat * 2) * 0.07;
    surface.rotation.z = beat * 0.6;
    swirl.scale.setScalar(0.85 + Math.abs(Math.sin(beat * 2)) * 0.3);
    swirl.position.y = 0.74 + Math.sin(beat * 2 + 0.6) * 0.06;
    head.rotation.z = slosh * 0.14;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.7)) * 0.35;
  };

  return {
    root,
    spinners: [{ part: paddle, axis: "y" as const, speed: 3.4 }],
    update,
    rest,
    frame: { camera: [6.2, 3.8, 8.8], target: [0, 1.8, 0] },
  };
}

/* ---------------------------------------------------- 6. Glue line ----- */

export function buildGlueLine(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, paper, cyan, magenta, glow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const bed = new THREE.Group();
  bed.position.y = 1.05;
  root.add(bed);
  addMesh(bed, new RoundedBoxGeometry(4.2, 0.42, 1.3, 4, 0.1), metal, [0, 0, 0]);
  for (const side of [-1, 1]) {
    addMesh(bed, new RoundedBoxGeometry(4.2, 0.16, 0.12, 3, 0.04), cyan, [0, 0.28, side * 0.6]);
  }

  const rollers: THREE.Mesh[] = [];
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    rollers.push(addMesh(bed, new THREE.CylinderGeometry(0.24, 0.24, 1.2, 20), rubber, [x, 0.3, 0], [Math.PI / 2, 0, 0]));
  }
  for (const [x, z] of [[-1.7, 0], [1.7, 0]] as [number, number][]) {
    addMesh(root, new RoundedBoxGeometry(0.3, 1.0, 0.9, 3, 0.08), darkMetal, [x, 0.5, z]);
  }

  // Blanks travelling along the bed with their flaps folding up.
  const blanks = [0, 1, 2].map((i) => {
    const blank = new THREE.Group();
    bed.add(blank);
    addMesh(blank, new RoundedBoxGeometry(0.9, 0.03, 0.85, 2, 0.01), paper, [0, 0, 0]);
    const flaps = [-1, 1].map((side) => {
      const flap = new THREE.Group();
      flap.position.set(side * 0.45, 0, 0);
      blank.add(flap);
      addMesh(flap, new RoundedBoxGeometry(0.4, 0.03, 0.85, 2, 0.01), paper, [side * 0.2, 0, 0]);
      return { flap, side };
    });
    return { blank, flaps, offset: i / 3 };
  });

  // Glue head with nozzles.
  const gun = new THREE.Group();
  gun.position.set(0.2, 0.95, 0);
  bed.add(gun);
  addMesh(gun, new RoundedBoxGeometry(0.8, 0.5, 0.9, 4, 0.12), darkMetal, [0, 0, 0]);
  for (const z of [-0.28, 0.28]) {
    addMesh(gun, new THREE.ConeGeometry(0.08, 0.28, 12), magenta, [0, -0.36, z], [Math.PI, 0, 0]);
    addMesh(gun, new THREE.SphereGeometry(0.05, 10, 8), glow, [0, -0.52, z]);
  }

  const head = new THREE.Group();
  head.position.set(-1.75, 1.4, 0);
  root.add(head);
  addMesh(head, new RoundedBoxGeometry(0.94, 0.7, 0.8, 5, 0.16), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.74, 0.46, 0.1, 4, 0.1), palette.screen, [0, 0, 0.42]);
  const eyes = addFace(head, palette, 0.64);
  eyes.position.z = 0.47;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    bed.rotation.set(0, 0, 0);
    gun.position.set(0.2, 0.95, 0);
    head.rotation.set(0, 0, 0);
    blanks.forEach(({ blank, flaps }) => {
      blank.position.set(0, 0.42, 0);
      flaps.forEach(({ flap }) => flap.rotation.set(0, 0, 0));
    });
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    bed.rotation.z = Math.sin(beat) * 0.03;
    gun.position.y = 0.95 - Math.abs(Math.sin(beat * 2)) * 0.16;
    head.rotation.y = Math.sin(beat * 0.7) * 0.35;
    head.rotation.z = Math.sin(beat * 2) * 0.12;

    blanks.forEach(({ blank, flaps, offset }) => {
      const travel = (beat * 0.22 + offset) % 1;
      blank.position.set(-1.9 + travel * 3.8, 0.42, 0);
      // Flaps fold once the blank is past the glue head.
      const fold = THREE.MathUtils.smoothstep(travel, 0.45, 0.8) * (Math.PI / 2);
      flaps.forEach(({ flap, side }) => {
        flap.rotation.z = side * fold;
      });
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.6)) * 0.35;
  };

  return {
    root,
    spinners: rollers.map((part) => ({ part, axis: "y" as const, speed: 3.0 })),
    update,
    rest,
    frame: { camera: [6.6, 3.6, 9.4], target: [0, 1.3, 0] },
  };
}

/* ---------------------------------------------------- 7. Stamper ------- */

export function buildStamper(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, screen, paper, cyan, yellow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const base = new THREE.Group();
  base.position.y = 0.72;
  root.add(base);
  addMesh(base, new RoundedBoxGeometry(2.4, 1.2, 1.8, 5, 0.16), darkMetal, [0, 0, 0]);
  addMesh(base, new RoundedBoxGeometry(2.0, 0.1, 1.4, 3, 0.03), paper, [0, 0.65, 0]);

  // Column and the heated stamping head.
  addMesh(root, new RoundedBoxGeometry(0.44, 3.0, 0.5, 4, 0.1), metal, [-1.05, 2.2, 0]);

  const ram = new THREE.Group();
  ram.position.set(0.15, 2.5, 0);
  root.add(ram);
  addMesh(ram, new RoundedBoxGeometry(1.7, 0.6, 1.3, 5, 0.14), metal, [0, 0, 0]);
  addMesh(ram, new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16), darkMetal, [0, -0.5, 0]);
  const die = addMesh(ram, new RoundedBoxGeometry(1.1, 0.24, 0.9, 3, 0.05), yellow, [0, -0.9, 0]);

  // Foil ribbon running between two reels over the work.
  const reels: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    reels.push(addMesh(root, new THREE.CylinderGeometry(0.36, 0.36, 0.5, 22), side < 0 ? yellow : metal,
      [side * 1.25, 3.3, 0], [0, 0, Math.PI / 2]));
  }
  const ribbon = addMesh(root, new RoundedBoxGeometry(2.5, 0.03, 0.44, 2, 0.01), yellow, [0, 3.3, 0]);

  const head = new THREE.Group();
  head.position.set(-1.05, 3.95, 0);
  root.add(head);
  addMesh(head, new RoundedBoxGeometry(1.0, 0.7, 0.8, 5, 0.16), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.78, 0.46, 0.1, 4, 0.1), screen, [0, 0, 0.42]);
  const eyes = addFace(head, palette, 0.66);
  eyes.position.z = 0.47;
  addMesh(head, new THREE.TorusGeometry(0.16, 0.04, 10, 20), cyan, [0, 0.5, 0], [Math.PI / 2, 0, 0]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    ram.position.set(0.15, 2.5, 0);
    ram.rotation.set(0, 0, 0);
    base.rotation.set(0, 0, 0);
    die.scale.set(1, 1, 1);
    ribbon.position.y = 3.3;
    head.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    // Dwell at the top, punch down, hold - foil stamping needs pressure and time.
    const cycle = (Math.sin(beat) + 1) / 2;
    const press = Math.pow(cycle, 3);
    ram.position.y = 2.5 - press * 0.85;
    ram.rotation.z = Math.sin(beat * 0.5) * 0.02;
    base.rotation.z = press * 0.015;
    die.scale.y = 1 + press * 0.12;
    ribbon.position.y = 3.3 - Math.sin(beat * 2) * 0.05;
    head.rotation.z = Math.sin(beat * 2) * 0.12;
    head.rotation.y = Math.sin(beat * 0.6) * 0.3;
    eyes.scale.y = 1 - press * 0.5;
  };

  return {
    root,
    spinners: reels.map((part, i) => ({ part, axis: "x" as const, speed: i === 0 ? 1.5 : -1.5 })),
    update,
    rest,
    frame: { camera: [6.4, 4.2, 9.2], target: [0, 2.4, 0] },
  };
}

/* ---------------------------------------------------- 8. Platesetter --- */

export function buildPlatesetter(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, screen, cyan, magenta, glow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const cabinet = new THREE.Group();
  cabinet.position.y = 1.15;
  root.add(cabinet);
  addMesh(cabinet, new RoundedBoxGeometry(3.0, 2.0, 1.9, 6, 0.18), metal, [0, 0, 0]);
  addMesh(cabinet, new RoundedBoxGeometry(3.05, 0.14, 1.95, 3, 0.05), cyan, [0, -0.8, 0]);

  // Exposed drum with a plate wrapped around it.
  const drum = addMesh(cabinet, new THREE.CylinderGeometry(0.78, 0.78, 2.1, 40), darkMetal, [0, 0.45, 0], [0, 0, Math.PI / 2]);
  const plate = addMesh(cabinet, new THREE.CylinderGeometry(0.82, 0.82, 1.8, 40, 1, true, 0, Math.PI * 1.25),
    magenta, [0, 0.45, 0], [0, 0, Math.PI / 2]);

  // Laser carriage tracking across the drum.
  const carriage = new THREE.Group();
  carriage.position.set(0, 1.45, 0.5);
  cabinet.add(carriage);
  addMesh(carriage, new RoundedBoxGeometry(0.44, 0.36, 0.44, 3, 0.08), darkMetal, [0, 0, 0]);
  addMesh(carriage, new THREE.ConeGeometry(0.1, 0.3, 12), cyan, [0, -0.26, 0], [Math.PI, 0, 0]);
  const spot = addMesh(carriage, new THREE.SphereGeometry(0.06, 12, 10), glow, [0, -0.42, 0]);
  addMesh(cabinet, new THREE.CylinderGeometry(0.05, 0.05, 2.4, 10), metal, [0, 1.45, 0.5], [0, 0, Math.PI / 2]);

  const head = new THREE.Group();
  head.position.set(0, 1.3, 1.0);
  cabinet.add(head);
  addMesh(head, new RoundedBoxGeometry(1.5, 0.85, 0.26, 5, 0.16), darkMetal, [0, 0, 0], [-0.26, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(1.24, 0.6, 0.08, 4, 0.1), screen, [0, 0.02, 0.14], [-0.26, 0, 0]);
  const eyes = addFace(head, palette, 0.78);
  eyes.position.set(0, 0.04, 0.2);
  eyes.rotation.x = -0.26;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    cabinet.rotation.set(0, 0, 0);
    carriage.position.set(0, 1.45, 0.5);
    spot.scale.setScalar(1);
    plate.rotation.set(0, 0, Math.PI / 2);
    head.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    cabinet.rotation.z = Math.sin(beat) * 0.04;
    cabinet.position.y = 1.15 + Math.abs(Math.sin(beat * 2)) * 0.06;
    // Carriage sweeps the drum while the plate turns under it.
    carriage.position.x = Math.sin(beat * 0.8) * 0.9;
    plate.rotation.y = beat * 1.4;
    spot.scale.setScalar(0.7 + Math.abs(Math.sin(beat * 4)) * 0.7);
    head.rotation.z = Math.sin(beat * 2) * 0.1;
    head.rotation.y = Math.sin(beat * 0.6) * 0.24;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.7)) * 0.35;
  };

  return {
    root,
    spinners: [{ part: drum, axis: "y" as const, speed: 1.4 }],
    update,
    rest,
    frame: { camera: [6.4, 3.9, 9.0], target: [0, 1.7, 0] },
  };
}

/* ---------------------------------------------------- 9. Rack ---------- */

export function buildRack(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, cyan, magenta, glow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const cabinet = new THREE.Group();
  cabinet.position.y = 2.0;
  root.add(cabinet);
  addMesh(cabinet, new RoundedBoxGeometry(1.9, 3.6, 1.5, 6, 0.14), darkMetal, [0, 0, 0]);
  addMesh(cabinet, new RoundedBoxGeometry(1.95, 0.14, 1.55, 3, 0.05), cyan, [0, -1.85, 0]);

  // Server blades with status LEDs.
  const leds: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const y = 1.35 - i * 0.44;
    addMesh(cabinet, new RoundedBoxGeometry(1.7, 0.34, 0.1, 3, 0.04), metal, [0, y, 0.72]);
    for (let j = 0; j < 4; j++) {
      leds.push(
        addMesh(cabinet, new THREE.SphereGeometry(0.045, 10, 8),
          (i + j) % 3 === 0 ? magenta : cyan, [-0.66 + j * 0.2, y, 0.79]),
      );
    }
  }

  // Cable arms looping out of the back.
  const cables = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.95, 0.9, -0.4);
    cabinet.add(arm);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.6, -0.3, -0.4),
      new THREE.Vector3(side * 0.9, -1.1, 0.1),
      new THREE.Vector3(side * 0.7, -1.8, 0.3),
    ]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 8, false), rubber);
    mesh.castShadow = true;
    arm.add(mesh);
    return { arm, side };
  });

  const head = new THREE.Group();
  head.position.y = 2.15;
  cabinet.add(head);
  addMesh(head, new RoundedBoxGeometry(1.6, 0.8, 1.0, 5, 0.18), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(1.3, 0.56, 0.1, 4, 0.12), screen, [0, 0, 0.52]);
  const eyes = addFace(head, palette, 0.8);
  eyes.position.z = 0.57;
  addMesh(head, new THREE.SphereGeometry(0.07, 12, 10), glow, [0.66, 0.32, 0.3]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    cabinet.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    cables.forEach(({ arm }) => arm.rotation.set(0, 0, 0));
    leds.forEach((led) => led.scale.setScalar(1));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const sway = Math.sin(beat);
    root.position.y = 0.08 + Math.abs(Math.sin(beat * 2)) * 0.08;
    cabinet.rotation.z = sway * 0.09;
    cabinet.rotation.y = Math.sin(beat * 0.5) * 0.28;
    head.rotation.z = Math.sin(beat * 2) * 0.14;
    cables.forEach(({ arm, side }) => {
      arm.rotation.z = side * Math.sin(beat * 1.3) * 0.3;
      arm.rotation.x = Math.sin(beat * 1.7 + side) * 0.2;
    });
    // LEDs flicker in a rolling pattern rather than in unison.
    leds.forEach((led, i) => {
      led.scale.setScalar(0.6 + Math.abs(Math.sin(beat * 3 - i * 0.4)) * 0.9);
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.6)) * 0.35;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.2, 4.2, 9.0], target: [0, 2.3, 0] } };
}

/* ---------------------------------------------------- 10. Vault -------- */

export function buildVault(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, cyan, magenta, yellow, glow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const body = new THREE.Group();
  body.position.y = 1.55;
  root.add(body);
  addMesh(body, new RoundedBoxGeometry(2.5, 2.7, 2.0, 6, 0.2), darkMetal, [0, 0, 0]);
  addMesh(body, new RoundedBoxGeometry(2.55, 0.16, 2.05, 3, 0.05), cyan, [0, -1.3, 0]);
  // Coin slot.
  addMesh(body, new RoundedBoxGeometry(0.7, 0.1, 0.14, 2, 0.03), yellow, [0, 1.2, 1.0]);

  // The door is the face; the dial is its nose.
  const door = new THREE.Group();
  door.position.z = 1.0;
  body.add(door);
  addMesh(door, new RoundedBoxGeometry(2.1, 2.3, 0.2, 5, 0.14), metal, [0, 0, 0]);
  addMesh(door, new THREE.TorusGeometry(0.95, 0.06, 12, 44), cyan, [0, 0, 0.11]);
  const eyes = addFace(door, palette, 0.85);
  eyes.position.set(0, 0.4, 0.14);

  const dial = new THREE.Group();
  dial.position.set(0, -0.42, 0.16);
  door.add(dial);
  addMesh(dial, new THREE.CylinderGeometry(0.32, 0.32, 0.12, 28), darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) {
    addMesh(dial, new RoundedBoxGeometry(0.08, 0.5, 0.08, 2, 0.02), magenta, [0, 0, 0.06], [0, 0, (i / 4) * Math.PI]);
  }
  const handle = addMesh(door, new THREE.TorusGeometry(0.24, 0.05, 10, 24), yellow, [0.72, -0.42, 0.14]);

  for (const side of [-1, 1]) {
    addMesh(root, new THREE.CapsuleGeometry(0.16, 0.2, 6, 14), rubber, [side * 0.85, 0.2, 0.5]);
  }
  addMesh(body, new THREE.SphereGeometry(0.08, 12, 10), glow, [0, 1.45, 0.6]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
    door.rotation.set(0, 0, 0);
    dial.rotation.set(Math.PI / 2, 0, 0);
    handle.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const bump = Math.abs(Math.sin(beat));
    root.position.y = 0.08 + bump * 0.12;
    body.rotation.z = Math.sin(beat) * 0.08;
    body.rotation.y = Math.sin(beat * 0.45) * 0.3;
    // Dial spins one way then the other, like a combination being worked.
    dial.rotation.y = Math.sin(beat * 0.7) * 2.4;
    handle.rotation.z = Math.sin(beat * 1.4) * 0.6;
    door.rotation.y = Math.max(0, Math.sin(beat * 0.5)) * 0.12;   // cracks open
    eyes.scale.y = 0.75 + bump * 0.35;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.2, 3.8, 8.8], target: [0, 1.8, 0] } };
}

/* ---------------------------------------------------- 11. Trolley ------ */

export function buildSampleTrolley(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, paper, cyan, magenta, yellow } = palette;
  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const cart = new THREE.Group();
  cart.position.y = 0.95;
  root.add(cart);

  // Three shelves on a tubular frame.
  const shelfYs = [-0.35, 0.35, 1.05];
  shelfYs.forEach((y) => {
    addMesh(cart, new RoundedBoxGeometry(1.9, 0.09, 1.15, 3, 0.03), metal, [0, y, 0]);
    addMesh(cart, new RoundedBoxGeometry(1.92, 0.06, 0.06, 2, 0.02), cyan, [0, y + 0.08, 0.56]);
  });
  for (const [x, z] of [[-0.85, -0.5], [-0.85, 0.5], [0.85, -0.5], [0.85, 0.5]] as [number, number][]) {
    addMesh(cart, new THREE.CylinderGeometry(0.06, 0.06, 1.9, 12), darkMetal, [x, 0.35, z]);
  }

  // Sample stack and swatch fan riding on the shelves.
  const samples: { mesh: THREE.Mesh; home: [number, number, number] }[] = [];
  const layout: [number, number, number][] = [
    [-0.5, -0.15, 0], [0.1, -0.15, 0.2], [0.6, -0.15, -0.2],
    [-0.4, 0.55, 0.1], [0.35, 0.55, -0.1],
  ];
  layout.forEach((home, i) => {
    samples.push({
      mesh: addMesh(cart, new RoundedBoxGeometry(0.44, 0.3, 0.44, 3, 0.04), i % 2 ? paper : yellow, home),
      home,
    });
  });

  const fan = new THREE.Group();
  fan.position.set(0, 1.25, 0);
  cart.add(fan);
  const blades = [0, 1, 2, 3, 4].map((i) => {
    const blade = new THREE.Group();
    blade.position.set(-0.4, 0, 0);
    fan.add(blade);
    addMesh(blade, new RoundedBoxGeometry(0.7, 0.04, 0.16, 2, 0.02),
      [cyan, magenta, yellow, paper, metal][i], [0.35, 0, 0]);
    return { blade, index: i };
  });

  // Push handle with the face on top.
  const handle = new THREE.Group();
  handle.position.set(-1.0, 0.35, 0);
  cart.add(handle);
  addMesh(handle, new THREE.CylinderGeometry(0.07, 0.07, 1.5, 12), metal, [0, 0.75, 0]);
  addMesh(handle, new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12), rubber, [0, 1.5, 0], [Math.PI / 2, 0, 0]);

  const head = new THREE.Group();
  head.position.set(-0.1, 1.95, 0);
  handle.add(head);
  addMesh(head, new RoundedBoxGeometry(0.92, 0.66, 0.76, 5, 0.16), darkMetal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.72, 0.44, 0.1, 4, 0.1), palette.screen, [0, 0, 0.4]);
  const eyes = addFace(head, palette, 0.62);
  eyes.position.z = 0.45;

  const wheels: THREE.Mesh[] = [];
  for (const [x, z] of [[-0.8, -0.45], [-0.8, 0.45], [0.8, -0.45], [0.8, 0.45]] as [number, number][]) {
    wheels.push(addMesh(cart, new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), rubber, [x, -0.75, z], [0, 0, Math.PI / 2]));
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    cart.position.set(0, 0.95, 0);
    cart.rotation.set(0, 0, 0);
    handle.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    fan.rotation.set(0, 0, 0);
    blades.forEach(({ blade }) => blade.rotation.set(0, 0, 0));
    samples.forEach(({ mesh, home }) => mesh.position.set(home[0], home[1], home[2]));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const push = Math.sin(beat);
    cart.position.y = 0.95 + Math.abs(Math.sin(beat * 2)) * 0.09;
    cart.rotation.z = push * 0.05;
    handle.rotation.z = -0.1 + push * 0.16;
    head.rotation.y = Math.sin(beat * 0.7) * 0.4;
    head.rotation.z = Math.sin(beat * 2) * 0.14;
    // Swatch fan opens and closes.
    const spread = (Math.sin(beat * 0.8) + 1) / 2;
    blades.forEach(({ blade, index }) => {
      blade.rotation.y = spread * (index - 2) * 0.42;
    });
    fan.rotation.z = push * 0.12;
    samples.forEach(({ mesh, home }, i) => {
      mesh.position.y = home[1] + Math.sin(beat * 2 - i * 0.6) * 0.04;
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.65)) * 0.35;
  };

  return {
    root,
    spinners: wheels.map((part) => ({ part, axis: "x" as const, speed: 2.4 })),
    update,
    rest,
    frame: { camera: [6.2, 3.6, 8.8], target: [0, 1.5, 0] },
  };
}
