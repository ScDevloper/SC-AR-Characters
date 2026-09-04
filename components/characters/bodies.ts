import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { addBrandBadge, addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/* ------------------------------------------------------------------ *
 * 1. Rover - tracked delivery unit, no legs at all
 * ------------------------------------------------------------------ */

export function buildRover(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const chassis = new THREE.Group();
  chassis.position.y = 0.38;
  root.add(chassis);
  addMesh(chassis, new RoundedBoxGeometry(2.5, 0.72, 1.7, 5, 0.16), darkMetal, [0, 0, 0]);
  addMesh(chassis, new RoundedBoxGeometry(2.1, 0.12, 1.3, 3, 0.05), cyan, [0, -0.42, 0]);

  const wheels: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const track = new THREE.Group();
    track.position.set(side * 1.06, -0.1, 0);
    chassis.add(track);
    addMesh(track, new RoundedBoxGeometry(0.36, 0.86, 2.24, 4, 0.3), rubber, [0, 0, 0]);
    for (const z of [-0.72, 0, 0.72]) {
      wheels.push(
        addMesh(
          track,
          new THREE.CylinderGeometry(0.34, 0.34, 0.42, 22),
          z === 0 ? metal : darkMetal,
          [0, -0.02, z],
          [0, 0, Math.PI / 2],
        ),
      );
    }
  }

  addBrandBadge(chassis, {
    position: [0, 0.1, 0.87],
    size: [1.35, 0.42],
  });

  // Cargo bed: a stack of cartons that jiggles.
  const cargo = new THREE.Group();
  cargo.position.set(-0.35, 0.52, 0);
  chassis.add(cargo);
  const cartons: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    cartons.push(
      addMesh(
        cargo,
        new RoundedBoxGeometry(0.86 - i * 0.08, 0.36, 0.86 - i * 0.08, 3, 0.04),
        paper,
        [0, i * 0.38, 0],
        [0, i * 0.22, 0],
      ),
    );
  }

  // Turret head on a neck column.
  const neck = new THREE.Group();
  neck.position.set(0.72, 0.36, 0);
  chassis.add(neck);
  addMesh(neck, new THREE.CylinderGeometry(0.22, 0.3, 0.6, 20), metal, [0, 0.3, 0]);

  const head = new THREE.Group();
  head.position.y = 0.95;
  neck.add(head);
  addMesh(head, new RoundedBoxGeometry(1.16, 0.86, 0.9, 5, 0.2), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.94, 0.62, 0.12, 4, 0.14), screen, [0, 0, 0.46], [0, 0, 0]);
  addMesh(head, new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), darkMetal, [0, 0.6, 0]);
  const beacon = addMesh(head, new THREE.SphereGeometry(0.13, 18, 12), magenta, [0, 0.88, 0]);
  const eyes = addFace(head, palette, 0.8);
  eyes.position.z = 0.54;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    chassis.rotation.set(0, 0, 0);
    neck.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    cargo.rotation.set(0, 0, 0);
    cartons.forEach((box, i) => box.position.set(0, i * 0.38, 0));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const swing = Math.sin(beat);
    const bump = Math.abs(Math.sin(beat * 2));
    root.position.y = 0.08 + bump * 0.06;
    root.rotation.y = Math.sin(beat * 0.42) * 0.55;
    chassis.rotation.z = swing * 0.09;
    chassis.rotation.x = Math.sin(beat * 2) * 0.04;
    neck.rotation.y = Math.sin(beat * 0.7) * 0.5;
    head.rotation.z = Math.sin(beat * 2 + 0.6) * 0.14;
    head.rotation.x = -0.08 + swing * 0.1;
    cargo.rotation.y = beat * 0.35;
    cartons.forEach((box, i) => {
      box.position.y = i * 0.38 + Math.sin(beat * 2 - i * 0.8) * 0.05;
      box.position.x = Math.sin(beat - i * 0.5) * 0.05;
    });
    beacon.scale.setScalar(0.85 + bump * 0.4);
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.5)) * 0.35;
  };

  return {
    root,
    spinners: wheels.map((part) => ({ part, axis: "x" as const, speed: 2.4 })),
    update,
    rest,
    frame: { camera: [6.2, 3.6, 8.4], target: [0, 1.3, 0] },
  };
}

/* ------------------------------------------------------------------ *
 * 2. Drone - hovering inspection unit, nothing touches the floor
 * ------------------------------------------------------------------ */

export function buildDrone(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, screen, cyan, magenta, glow } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const hull = new THREE.Group();
  hull.position.y = 2.7;
  root.add(hull);

  const shell = addMesh(hull, new THREE.SphereGeometry(0.92, 32, 24), metal, [0, 0, 0]);
  shell.scale.set(1, 0.82, 1);
  addMesh(hull, new THREE.TorusGeometry(0.95, 0.08, 14, 44), darkMetal, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addMesh(hull, new RoundedBoxGeometry(1.0, 0.6, 0.12, 4, 0.14), screen, [0, 0.05, 0.86]);
  const eyes = addFace(hull, palette, 0.85);
  eyes.position.set(0, 0.05, 0.94);

  addBrandBadge(hull, {
    position: [0, -0.38, 0.78],
    size: [1.1, 0.34],
  });

  // Four rotor booms.
  const rotors: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const boom = new THREE.Group();
    boom.rotation.y = -angle;
    hull.add(boom);
    addMesh(boom, new THREE.CylinderGeometry(0.075, 0.075, 1.1, 14), darkMetal, [0, 0.12, 0.62], [Math.PI / 2, 0, 0]);
    addMesh(boom, new THREE.CylinderGeometry(0.26, 0.26, 0.14, 20), metal, [0, 0.2, 1.15]);
    const rotor = new THREE.Mesh(
      new RoundedBoxGeometry(1.24, 0.035, 0.14, 2, 0.02),
      i % 2 === 0 ? cyan : magenta,
    );
    rotor.position.set(0, 0.32, 1.15);
    boom.add(rotor);
    rotors.push(rotor);
    const ghost = addMesh(
      boom,
      new THREE.RingGeometry(0.3, 0.62, 32),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? cyan.color : magenta.color,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
      }),
      [0, 0.33, 1.15],
      [-Math.PI / 2, 0, 0],
    );
    ghost.castShadow = false;
  }

  // Scanner ring and dangling grabber underneath.
  const scanner = new THREE.Group();
  scanner.position.y = -0.78;
  hull.add(scanner);
  addMesh(scanner, new THREE.TorusGeometry(0.44, 0.055, 12, 36), cyan, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addMesh(scanner, new THREE.CylinderGeometry(0.16, 0.22, 0.3, 18), darkMetal, [0, 0.14, 0]);
  const beam = addMesh(
    scanner,
    new THREE.ConeGeometry(0.5, 1.5, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: cyan.color,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [0, -0.78, 0],
    [Math.PI, 0, 0],
  );
  beam.castShadow = false;
  addMesh(scanner, new THREE.SphereGeometry(0.09, 16, 12), glow, [0, -0.08, 0]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    hull.position.set(0, 2.7, 0);
    hull.rotation.set(0, 0, 0);
    scanner.rotation.set(0, 0, 0);
    beam.scale.setScalar(1);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ t, beat }: { t: number; beat: number; delta: number }) => {
    // Lissajous hover: the body traces a lazy figure-eight in the air.
    hull.position.x = Math.sin(beat * 0.5) * 0.85;
    hull.position.z = Math.sin(beat) * 0.45;
    hull.position.y = 2.7 + Math.sin(beat * 1.5) * 0.28;
    hull.rotation.z = -Math.sin(beat * 0.5) * 0.28;
    hull.rotation.x = Math.sin(beat) * 0.2;
    hull.rotation.y = Math.sin(beat * 0.32) * 0.6;
    scanner.rotation.y = t * 1.6;
    beam.scale.setScalar(0.9 + Math.abs(Math.sin(beat * 2)) * 0.2);
    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat * 0.6)) * 0.4;
  };

  return {
    root,
    spinners: rotors.map((part, index) => ({
      part,
      axis: "y" as const,
      speed: index % 2 === 0 ? 26 : -26,
    })),
    update,
    rest,
    frame: { camera: [6.4, 4.2, 9.0], target: [0, 2.7, 0] },
  };
}

/* ------------------------------------------------------------------ *
 * 3. Roll - a paper reel that rocks on its own drum
 * ------------------------------------------------------------------ */

export function buildRoll(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, paper, cyan, magenta, film } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const drum = new THREE.Group();
  drum.position.y = 1.95;
  root.add(drum);

  const reel = addMesh(
    drum,
    new THREE.CylinderGeometry(1.45, 1.45, 1.9, 48),
    paper,
    [0, 0, 0],
    [0, 0, Math.PI / 2],
  );
  reel.castShadow = true;
  for (const x of [-0.96, 0.96]) {
    addMesh(drum, new THREE.TorusGeometry(1.46, 0.07, 12, 48), darkMetal, [x, 0, 0], [0, Math.PI / 2, 0]);
    addMesh(drum, new THREE.CylinderGeometry(0.3, 0.3, 0.34, 24), metal, [x * 1.12, 0, 0], [0, 0, Math.PI / 2]);
  }
  // Loose sheet peeling off the reel.
  const sheet = addMesh(drum, new RoundedBoxGeometry(1.5, 1.2, 0.02, 2, 0.02), film, [0, 0.4, 1.5], [-0.5, 0, 0]);

  // The face sits on a plate that stays upright while the reel spins.
  const face = new THREE.Group();
  face.position.set(0, 0, 0);
  drum.add(face);
  addMesh(face, new THREE.CircleGeometry(0.85, 40), darkMetal, [0, 0, 1.0]);
  const eyes = addFace(face, palette, 1.15);
  eyes.position.z = 1.03;

  addBrandBadge(drum, {
    position: [0, -0.72, 1.27],
    size: [1.25, 0.39],
  });

  // Little hopping feet.
  const feet: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.62, 0.15, 0);
    root.add(leg);
    addMesh(leg, new THREE.CapsuleGeometry(0.13, 0.42, 6, 14), rubber, [0, 0.1, 0]);
    addMesh(leg, new RoundedBoxGeometry(0.5, 0.2, 0.72, 3, 0.08), side < 0 ? cyan : magenta, [0, -0.28, 0.1]);
    feet.push(leg);
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    drum.rotation.set(0, 0, 0);
    face.rotation.set(0, 0, 0);
    feet.forEach((leg, i) => leg.position.set(i === 0 ? -0.62 : 0.62, 0.15, 0));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const sway = Math.sin(beat);
    root.rotation.z = sway * 0.16;
    root.position.x = -sway * 0.5;
    root.position.y = 0.08 + Math.abs(Math.sin(beat * 2)) * 0.1;
    // The reel counter-rotates so it looks like it is rolling along the floor.
    drum.rotation.z = sway * 0.6;
    face.rotation.z = -drum.rotation.z; // keep the face level
    sheet.rotation.x = -0.5 + Math.sin(beat * 2) * 0.22;
    feet.forEach((leg, i) => {
      const phase = i === 0 ? beat : beat + Math.PI;
      leg.position.y = 0.15 + Math.max(0, Math.sin(phase)) * 0.26;
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.5)) * 0.3;
  };

  return {
    root,
    spinners: [],
    update,
    rest,
    frame: { camera: [6.0, 3.6, 8.6], target: [0, 1.9, 0] },
  };
}

/* ------------------------------------------------------------------ *
 * 4. Stack - a carton tower that comes apart on the beat
 * ------------------------------------------------------------------ */

export function buildStack(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { darkMetal, rubber, paper, cyan, magenta, yellow } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const accents = [cyan, magenta, yellow];
  const boxes: THREE.Group[] = [];
  const sizes: [number, number, number][] = [
    [1.9, 1.05, 1.55],
    [1.66, 0.95, 1.36],
    [1.42, 0.9, 1.2],
  ];

  let y = 0.62;
  sizes.forEach((size, index) => {
    const box = new THREE.Group();
    box.position.y = y;
    root.add(box);
    addMesh(box, new RoundedBoxGeometry(size[0], size[1], size[2], 4, 0.07), paper, [0, 0, 0]);
    // Tape seam and printed band.
    addMesh(box, new RoundedBoxGeometry(size[0] * 0.22, size[1] + 0.02, size[2] + 0.02, 2, 0.02), accents[index], [0, 0, 0]);
    addMesh(box, new RoundedBoxGeometry(size[0] + 0.02, size[1] * 0.14, size[2] * 0.5, 2, 0.02), darkMetal, [0, size[1] * 0.28, 0]);
    boxes.push(box);
    y += size[1] + 0.06;
  });

  // Face on the top carton.
  const head = boxes[boxes.length - 1];
  addMesh(head, new RoundedBoxGeometry(1.0, 0.52, 0.06, 3, 0.06), darkMetal, [0, 0.05, 0.62]);
  const eyes = addFace(head, palette, 0.85);
  eyes.position.set(0, 0.05, 0.68);

  addBrandBadge(boxes[1], {
    position: [0, -0.08, 0.7],
    size: [1.2, 0.38],
  });

  // Flaps that open like ears.
  const flaps: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const flap = new THREE.Group();
    flap.position.set(side * 0.71, 0.4, 0);
    head.add(flap);
    addMesh(flap, new RoundedBoxGeometry(0.06, 0.7, 1.0, 2, 0.03), paper, [side * 0.03, 0.3, 0]);
    flaps.push(flap);
  }

  // Stubby feet under the bottom carton.
  for (const side of [-1, 1]) {
    addMesh(root, new THREE.CapsuleGeometry(0.16, 0.18, 6, 14), rubber, [side * 0.6, -0.05, 0.2]);
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    let cursor = 0.62;
    boxes.forEach((box, index) => {
      box.position.set(0, cursor, 0);
      box.rotation.set(0, 0, 0);
      cursor += sizes[index][1] + 0.06;
    });
    flaps.forEach((flap, i) => flap.rotation.set(0, 0, i === 0 ? 0.2 : -0.2));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    root.rotation.y = Math.sin(beat * 0.45) * 0.35;
    root.position.y = 0.08 + Math.abs(Math.sin(beat)) * 0.14;
    let cursor = 0.62;
    boxes.forEach((box, index) => {
      const phase = beat - index * 0.55;
      box.position.y = cursor + Math.max(0, Math.sin(phase)) * 0.22;
      box.position.x = Math.sin(phase) * 0.16;
      box.rotation.y = Math.sin(phase) * 0.32;
      box.rotation.z = -Math.sin(phase) * 0.08;
      cursor += sizes[index][1] + 0.06;
    });
    flaps.forEach((flap, i) => {
      const dir = i === 0 ? 1 : -1;
      flap.rotation.z = dir * (0.2 + Math.abs(Math.sin(beat * 2)) * 0.75);
    });
    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat)) * 0.4;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.0, 3.6, 8.4], target: [0, 1.8, 0] } };
}

/* ------------------------------------------------------------------ *
 * 5. Arm - bolted-down six-axis industrial arm
 * ------------------------------------------------------------------ */

export function buildArm(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = -0.08;
  scene.add(root);

  addMesh(root, new THREE.CylinderGeometry(1.15, 1.35, 0.34, 32), darkMetal, [0, 0.1, 0]);
  addMesh(root, new THREE.TorusGeometry(1.16, 0.06, 12, 44), cyan, [0, 0.28, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    addMesh(root, new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10), metal, [
      Math.cos(angle) * 1.0,
      0.3,
      Math.sin(angle) * 1.0,
    ]);
  }

  // Axis 1: the whole column swivels.
  const column = new THREE.Group();
  column.position.y = 0.28;
  root.add(column);
  addBrandBadge(column, {
    position: [0, 0.43, 0.77],
    size: [0.95, 0.3],
  });
  addMesh(column, new THREE.CylinderGeometry(0.72, 0.86, 0.9, 28), metal, [0, 0.45, 0]);
  addMesh(column, new RoundedBoxGeometry(0.5, 0.36, 1.0, 3, 0.06), darkMetal, [0, 0.9, 0]);

  // Axis 2: shoulder and upper link.
  const shoulder = new THREE.Group();
  shoulder.position.y = 1.0;
  column.add(shoulder);
  addMesh(shoulder, new THREE.CylinderGeometry(0.34, 0.34, 0.86, 24), darkMetal, [0, 0, 0], [0, 0, Math.PI / 2]);
  addMesh(shoulder, new RoundedBoxGeometry(0.62, 1.7, 0.68, 4, 0.14), metal, [0, 0.85, 0]);
  addMesh(shoulder, new RoundedBoxGeometry(0.68, 0.2, 0.16, 2, 0.04), cyan, [0, 0.85, 0.36]);

  // Axis 3: elbow and forearm.
  const elbow = new THREE.Group();
  elbow.position.y = 1.7;
  shoulder.add(elbow);
  addMesh(elbow, new THREE.CylinderGeometry(0.3, 0.3, 0.72, 22), darkMetal, [0, 0, 0], [0, 0, Math.PI / 2]);
  addMesh(elbow, new RoundedBoxGeometry(0.5, 1.4, 0.54, 4, 0.12), metal, [0, 0.7, 0]);
  addMesh(elbow, new RoundedBoxGeometry(0.54, 0.16, 0.12, 2, 0.03), magenta, [0, 0.7, 0.3]);

  // Axis 4-6: wrist, tool head and gripper - the head is the "face".
  const wrist = new THREE.Group();
  wrist.position.y = 1.42;
  elbow.add(wrist);
  addMesh(wrist, new THREE.CylinderGeometry(0.26, 0.26, 0.5, 20), darkMetal, [0, 0.1, 0], [0, 0, Math.PI / 2]);

  const head = new THREE.Group();
  head.position.y = 0.42;
  wrist.add(head);
  addMesh(head, new RoundedBoxGeometry(0.92, 0.7, 0.78, 5, 0.16), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.74, 0.5, 0.1, 4, 0.12), screen, [0, 0, 0.4]);
  const eyes = addFace(head, palette, 0.68);
  eyes.position.z = 0.46;

  const jaws: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const jaw = new THREE.Group();
    jaw.position.set(side * 0.22, 0.42, 0);
    head.add(jaw);
    addMesh(jaw, new RoundedBoxGeometry(0.14, 0.44, 0.3, 2, 0.04), darkMetal, [0, 0.2, 0]);
    addMesh(jaw, new RoundedBoxGeometry(0.12, 0.16, 0.28, 2, 0.03), rubber, [0, 0.42, 0]);
    jaws.push(jaw);
  }

  const rest = () => {
    root.position.set(0, -0.08, 0);
    root.rotation.set(0, 0, 0);
    column.rotation.set(0, 0, 0);
    shoulder.rotation.set(0, 0, -0.12);
    elbow.rotation.set(0, 0, 0.5);
    wrist.rotation.set(0, 0, -0.38);
    head.rotation.set(0, 0, 0);
    jaws.forEach((jaw, i) => jaw.rotation.set(0, 0, i === 0 ? 0.12 : -0.12));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const swing = Math.sin(beat);
    const snap = Math.sin(beat * 2);
    column.rotation.y = swing * 0.85;
    shoulder.rotation.z = -0.12 + swing * 0.3;
    shoulder.rotation.x = Math.sin(beat * 0.5) * 0.18;
    elbow.rotation.z = 0.5 - swing * 0.55;
    wrist.rotation.z = -0.38 + snap * 0.5;
    wrist.rotation.y = Math.sin(beat * 1.5) * 0.6;
    head.rotation.z = snap * 0.22;
    head.rotation.x = -swing * 0.18;
    jaws.forEach((jaw, i) => {
      const dir = i === 0 ? 1 : -1;
      jaw.rotation.z = dir * (0.12 + Math.abs(snap) * 0.4);
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.5)) * 0.35;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.6, 4.4, 9.0], target: [0, 2.6, 0] } };
}

/* ------------------------------------------------------------------ *
 * 6. Quad - four-legged plotter that walks in a wave
 * ------------------------------------------------------------------ */

export function buildQuad(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const body = new THREE.Group();
  body.position.y = 1.85;
  root.add(body);
  const shell = addMesh(body, new THREE.SphereGeometry(1.05, 32, 20), metal, [0, 0, 0]);
  shell.scale.set(1.25, 0.55, 1.0);
  addMesh(body, new THREE.TorusGeometry(1.16, 0.07, 12, 44), cyan, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addMesh(body, new RoundedBoxGeometry(0.9, 0.3, 0.5, 3, 0.08), darkMetal, [0, 0.34, 0]);
  addBrandBadge(body, {
    position: [0, -0.32, 0.94],
    size: [1.08, 0.34],
  });

  const head = new THREE.Group();
  head.position.set(0, 0.16, 0.92);
  body.add(head);
  addMesh(head, new RoundedBoxGeometry(0.86, 0.56, 0.5, 4, 0.14), darkMetal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.68, 0.4, 0.08, 3, 0.1), screen, [0, 0, 0.26]);
  const eyes = addFace(head, palette, 0.62);
  eyes.position.z = 0.3;

  // Pen turret underneath - this is a plotter, after all.
  const pen = new THREE.Group();
  pen.position.y = -0.42;
  body.add(pen);
  addMesh(pen, new THREE.CylinderGeometry(0.24, 0.3, 0.3, 18), darkMetal, [0, 0, 0]);
  addMesh(pen, new THREE.ConeGeometry(0.11, 0.42, 16), magenta, [0, -0.32, 0], [Math.PI, 0, 0]);

  const legs: { hip: THREE.Group; knee: THREE.Group; phase: number }[] = [];
  const corners: [number, number][] = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];
  corners.forEach(([sx, sz], index) => {
    const hip = new THREE.Group();
    hip.position.set(sx * 1.0, -0.1, sz * 0.72);
    hip.rotation.y = Math.atan2(sx, sz) * 0.55;
    body.add(hip);
    addMesh(hip, new THREE.SphereGeometry(0.22, 18, 14), darkMetal, [0, 0, 0]);
    addMesh(hip, new RoundedBoxGeometry(0.24, 0.86, 0.24, 3, 0.07), metal, [sx * 0.24, -0.36, 0], [0, 0, -sx * 0.5]);

    const knee = new THREE.Group();
    knee.position.set(sx * 0.6, -0.72, 0);
    hip.add(knee);
    addMesh(knee, new THREE.SphereGeometry(0.16, 16, 12), rubber, [0, 0, 0]);
    addMesh(knee, new RoundedBoxGeometry(0.2, 1.0, 0.2, 3, 0.06), metal, [0, -0.5, 0]);
    addMesh(knee, new THREE.SphereGeometry(0.17, 16, 12), rubber, [0, -1.0, 0]);

    legs.push({ hip, knee, phase: index * (Math.PI / 2) });
  });

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    body.position.set(0, 1.85, 0);
    body.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    legs.forEach(({ hip, knee }) => {
      hip.rotation.x = 0;
      knee.rotation.x = 0.25;
    });
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    body.position.y = 1.85 + Math.sin(beat * 2) * 0.16;
    body.rotation.z = Math.sin(beat) * 0.12;
    body.rotation.x = Math.sin(beat * 0.5) * 0.1;
    root.rotation.y = Math.sin(beat * 0.35) * 0.5;
    head.rotation.y = Math.sin(beat * 0.8) * 0.4;
    head.rotation.z = Math.sin(beat * 2) * 0.16;
    pen.rotation.y = beat * 0.9;
    legs.forEach(({ hip, knee, phase }) => {
      const step = Math.sin(beat + phase);
      hip.rotation.x = step * 0.42;
      knee.rotation.x = 0.25 + Math.max(0, -step) * 0.6;
    });
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.6)) * 0.3;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.4, 3.9, 8.8], target: [0, 2.0, 0] } };
}
