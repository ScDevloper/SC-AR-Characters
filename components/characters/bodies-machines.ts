import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/* ------------------------------------------------------------------ *
 * 1. Press - a printing unit, not a robot holding one
 * ------------------------------------------------------------------ */

export function buildPress(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, magenta, yellow, inkBlack } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const frame = new THREE.Group();
  frame.position.y = 1.5;
  root.add(frame);

  // Two side plates with the roller stack running between them.
  for (const side of [-1, 1]) {
    addMesh(frame, new RoundedBoxGeometry(0.34, 2.9, 1.9, 5, 0.14), darkMetal, [side * 1.32, 0, 0]);
    addMesh(frame, new THREE.TorusGeometry(0.4, 0.06, 12, 30), side < 0 ? cyan : magenta, [side * 1.5, 0.5, 0], [0, Math.PI / 2, 0]);
  }
  addMesh(frame, new RoundedBoxGeometry(2.4, 0.3, 1.7, 4, 0.1), metal, [0, -1.42, 0]);

  const rollers: THREE.Mesh[] = [];
  const inks = [cyan, magenta, yellow, inkBlack];
  inks.forEach((ink, i) => {
    const y = 0.95 - i * 0.62;
    rollers.push(
      addMesh(frame, new THREE.CylinderGeometry(0.42, 0.42, 2.5, 30), metal, [0, y, 0], [0, 0, Math.PI / 2]),
    );
    // Ink duct feeding each roller, so the CMYK order reads at a glance.
    addMesh(frame, new RoundedBoxGeometry(0.34, 0.22, 2.2, 3, 0.06), ink, [0.86, y + 0.28, 0]);
    addMesh(frame, new THREE.CylinderGeometry(0.16, 0.16, 2.3, 16), rubber, [-0.78, y - 0.1, 0], [0, 0, Math.PI / 2]);
  });

  // Sheet travelling out of the delivery end.
  const sheet = addMesh(frame, new RoundedBoxGeometry(1.4, 0.02, 1.5, 2, 0.01), paper, [1.5, -1.2, 0], [0, 0, -0.12]);

  // Control panel: the face.
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0.9);
  root.add(head);
  addMesh(head, new THREE.CylinderGeometry(0.09, 0.09, 0.7, 12), darkMetal, [0, -0.45, -0.1]);
  addMesh(head, new RoundedBoxGeometry(1.5, 0.92, 0.22, 5, 0.16), metal, [0, 0, 0], [-0.24, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(1.24, 0.66, 0.08, 4, 0.1), screen, [0, 0.03, 0.14], [-0.24, 0, 0]);
  const eyes = addFace(head, palette, 0.82);
  eyes.position.set(0, 0.06, 0.2);
  eyes.rotation.x = -0.24;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    frame.rotation.set(0, 0, 0);
    frame.position.set(0, 1.5, 0);
    head.rotation.set(0, 0, 0);
    sheet.position.set(1.5, -1.2, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const pulse = Math.sin(beat);
    frame.position.y = 1.5 + Math.abs(Math.sin(beat * 2)) * 0.1;
    frame.rotation.z = pulse * 0.05;
    head.rotation.z = Math.sin(beat * 2) * 0.12;
    head.rotation.y = pulse * 0.25;
    // Sheet is spat out repeatedly rather than swinging back and forth.
    const travel = (beat * 0.5) % 1;
    sheet.position.x = 1.5 + travel * 1.1;
    sheet.position.y = -1.2 - travel * 0.35;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.6)) * 0.35;
  };

  return {
    root,
    spinners: rollers.map((part, i) => ({ part, axis: "y" as const, speed: 4.2 - i * 0.4 })),
    update,
    rest,
    frame: { camera: [6.6, 4.0, 9.0], target: [0, 1.9, 0] },
  };
}

/* ------------------------------------------------------------------ *
 * 2. Kiosk - a screen on a pedestal, all face
 * ------------------------------------------------------------------ */

export function buildKiosk(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, screen, cyan, magenta, glow } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  addMesh(root, new THREE.CylinderGeometry(1.0, 1.24, 0.3, 32), darkMetal, [0, 0.07, 0]);
  addMesh(root, new THREE.TorusGeometry(1.02, 0.06, 12, 40), cyan, [0, 0.24, 0], [Math.PI / 2, 0, 0]);

  const column = new THREE.Group();
  column.position.y = 0.22;
  root.add(column);
  addMesh(column, new THREE.CylinderGeometry(0.3, 0.42, 1.5, 24), metal, [0, 0.75, 0]);
  addMesh(column, new RoundedBoxGeometry(0.7, 0.26, 0.4, 3, 0.07), darkMetal, [0, 1.5, 0]);

  // The panel is the head: big, tilted, mostly screen.
  const panel = new THREE.Group();
  panel.position.y = 2.1;
  column.add(panel);
  addMesh(panel, new RoundedBoxGeometry(2.5, 1.7, 0.24, 6, 0.18), metal, [0, 0, 0]);
  addMesh(panel, new RoundedBoxGeometry(2.22, 1.42, 0.06, 5, 0.12), screen, [0, 0, 0.15]);
  const eyes = addFace(panel, palette, 1.5);
  eyes.position.z = 0.2;

  for (const side of [-1, 1]) {
    addMesh(panel, new THREE.SphereGeometry(0.06, 12, 10), glow, [side * 1.06, 0.72, 0.16]);
  }

  // Wiper arms hinged at the panel's lower corners.
  const wipers = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 1.2, -0.72, 0.1);
    panel.add(arm);
    addMesh(arm, new RoundedBoxGeometry(0.14, 1.2, 0.14, 3, 0.05), darkMetal, [0, 0.55, 0]);
    addMesh(arm, new RoundedBoxGeometry(0.1, 1.0, 0.08, 2, 0.03), rubber, [side * 0.1, 0.95, 0.06]);
    addMesh(arm, new THREE.SphereGeometry(0.13, 14, 12), side < 0 ? cyan : magenta, [0, 0, 0]);
    return { arm, side };
  });

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    column.rotation.set(0, 0, 0);
    panel.rotation.set(-0.1, 0, 0);
    wipers.forEach(({ arm, side }) => arm.rotation.set(0, 0, side * 0.25));
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const sway = Math.sin(beat);
    root.position.y = 0.08 + Math.abs(Math.sin(beat * 2)) * 0.07;
    column.rotation.y = sway * 0.5;
    panel.rotation.x = -0.1 + Math.sin(beat * 2) * 0.14;
    panel.rotation.z = sway * 0.13;
    wipers.forEach(({ arm, side }, i) => {
      arm.rotation.z = side * (0.25 + Math.abs(Math.sin(beat * 1.5 + i * 1.4)) * 0.9);
    });
    eyes.scale.y = 0.65 + Math.abs(Math.sin(beat * 0.7)) * 0.5;
    eyes.position.x = sway * 0.12;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.4, 4.0, 9.0], target: [0, 2.2, 0] } };
}

/* ------------------------------------------------------------------ *
 * 3. Orb - a single floating eye inside gyroscope rings
 * ------------------------------------------------------------------ */

export function buildOrb(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, cyan, magenta, glow, screen } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const core = new THREE.Group();
  core.position.y = 2.5;
  root.add(core);

  addMesh(core, new THREE.SphereGeometry(0.86, 40, 28), metal, [0, 0, 0]);
  addMesh(core, new THREE.SphereGeometry(0.87, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.6), darkMetal, [0, 0, 0], [0.4, 0, 0]);

  // One big eye instead of a face - a different read from every other build.
  const eye = new THREE.Group();
  eye.position.z = 0.5;
  core.add(eye);
  addMesh(eye, new THREE.SphereGeometry(0.46, 32, 24), screen, [0, 0, 0]);
  const iris = addMesh(eye, new THREE.CircleGeometry(0.26, 32), cyan, [0, 0, 0.4]);
  const pupil = addMesh(eye, new THREE.CircleGeometry(0.12, 24), palette.inkBlack, [0, 0, 0.42]);
  addMesh(eye, new THREE.SphereGeometry(0.05, 12, 10), glow, [0.12, 0.14, 0.42]);

  // Three gyroscope rings on different axes.
  const rings = [
    { mesh: addMesh(core, new THREE.TorusGeometry(1.25, 0.05, 12, 60), cyan, [0, 0, 0], [Math.PI / 2, 0, 0]), axis: "y" as const, speed: 0.9 },
    { mesh: addMesh(core, new THREE.TorusGeometry(1.45, 0.045, 12, 60), magenta, [0, 0, 0], [0, 0, 0.5]), axis: "x" as const, speed: -0.7 },
    { mesh: addMesh(core, new THREE.TorusGeometry(1.62, 0.04, 12, 60), darkMetal, [0, 0, 0], [0.9, 0.4, 0]), axis: "z" as const, speed: 0.5 },
  ];

  const beam = addMesh(
    core,
    new THREE.ConeGeometry(0.7, 2.0, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: cyan.color,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [0, -1.5, 0],
    [Math.PI, 0, 0],
  );
  beam.castShadow = false;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    core.position.set(0, 2.5, 0);
    core.rotation.set(0, 0, 0);
    eye.rotation.set(0, 0, 0);
    iris.scale.setScalar(1);
    pupil.scale.setScalar(1);
    rings.forEach(({ mesh, axis }) => {
      mesh.rotation[axis] = 0;
    });
    beam.scale.setScalar(1);
  };

  const update = ({ t, beat }: { t: number; beat: number; delta: number }) => {
    core.position.y = 2.5 + Math.sin(beat) * 0.34;
    core.position.x = Math.sin(beat * 0.5) * 0.5;
    core.rotation.z = Math.sin(beat * 0.5) * 0.2;
    // The eye looks around independently of the shell.
    eye.rotation.y = Math.sin(beat * 0.7) * 0.5;
    eye.rotation.x = Math.sin(beat * 0.9) * 0.3;
    pupil.scale.setScalar(0.8 + Math.abs(Math.sin(beat * 2)) * 0.45);
    iris.scale.setScalar(0.95 + Math.sin(beat) * 0.08);
    beam.scale.setScalar(0.9 + Math.abs(Math.sin(beat)) * 0.25);
    rings.forEach(({ mesh, axis, speed }) => {
      mesh.rotation[axis] = t * speed;
    });
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.4, 4.2, 9.2], target: [0, 2.5, 0] } };
}

/* ------------------------------------------------------------------ *
 * 4. Gantry - wide overhead crane, the only horizontal silhouette
 * ------------------------------------------------------------------ */

export function buildGantry(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, cyan, magenta, yellow } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const SPAN = 4.4;
  const wheels: THREE.Mesh[] = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * (SPAN / 2), 0, 0);
    root.add(leg);
    addMesh(leg, new RoundedBoxGeometry(0.36, 3.0, 0.36, 4, 0.1), metal, [0, 1.6, 0]);
    addMesh(leg, new RoundedBoxGeometry(0.9, 0.34, 1.5, 4, 0.12), darkMetal, [0, 0.18, 0]);
    for (const z of [-0.55, 0.55]) {
      wheels.push(
        addMesh(leg, new THREE.CylinderGeometry(0.24, 0.24, 0.2, 18), rubber, [0, 0.02, z], [0, 0, Math.PI / 2]),
      );
    }
    addMesh(leg, new RoundedBoxGeometry(0.42, 0.16, 0.42, 2, 0.05), side < 0 ? cyan : magenta, [0, 2.9, 0]);
  }

  // Cross beam with a hazard stripe.
  const beam = new THREE.Group();
  beam.position.y = 3.15;
  root.add(beam);
  addMesh(beam, new RoundedBoxGeometry(SPAN + 0.8, 0.42, 0.62, 4, 0.12), metal, [0, 0, 0]);
  addMesh(beam, new RoundedBoxGeometry(SPAN + 0.85, 0.12, 0.1, 2, 0.03), yellow, [0, 0.24, 0.3]);

  // Trolley rides the beam; the hoist below it carries the face.
  const trolley = new THREE.Group();
  beam.add(trolley);
  addMesh(trolley, new RoundedBoxGeometry(0.8, 0.44, 0.8, 4, 0.1), darkMetal, [0, -0.36, 0]);
  const drum = addMesh(trolley, new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16), metal, [0, -0.36, 0], [0, 0, Math.PI / 2]);

  const cable = addMesh(trolley, new THREE.CylinderGeometry(0.03, 0.03, 1, 8), darkMetal, [0, -1.1, 0]);

  const hoist = new THREE.Group();
  hoist.position.y = -1.7;
  trolley.add(hoist);
  addMesh(hoist, new RoundedBoxGeometry(1.0, 0.8, 0.8, 5, 0.16), metal, [0, 0, 0]);
  addMesh(hoist, new RoundedBoxGeometry(0.8, 0.5, 0.08, 4, 0.1), palette.screen, [0, 0, 0.42]);
  const eyes = addFace(hoist, palette, 0.7);
  eyes.position.z = 0.47;
  for (const side of [-1, 1]) {
    addMesh(hoist, new THREE.TorusGeometry(0.16, 0.045, 10, 20), yellow, [side * 0.3, -0.5, 0], [Math.PI / 2, 0, 0]);
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    beam.rotation.set(0, 0, 0);
    trolley.position.set(0, 0, 0);
    hoist.position.set(0, -1.7, 0);
    hoist.rotation.set(0, 0, 0);
    cable.position.set(0, -1.1, 0);
    cable.scale.set(1, 1, 1);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const slide = Math.sin(beat * 0.6);
    const lift = Math.sin(beat * 1.4);

    trolley.position.x = slide * (SPAN / 2 - 0.3);
    beam.rotation.z = -slide * 0.02;

    const drop = 1.7 + lift * 0.45;
    hoist.position.y = -drop;
    hoist.rotation.z = -slide * 0.22; // load swings against the travel
    hoist.rotation.y = Math.sin(beat * 0.8) * 0.4;

    // Cable is a unit cylinder scaled to bridge trolley and hoist.
    cable.scale.y = drop - 0.6;
    cable.position.y = -0.36 - (drop - 0.36) / 2;

    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat * 0.8)) * 0.4;
  };

  return {
    root,
    spinners: [
      ...wheels.map((part) => ({ part, axis: "x" as const, speed: 1.4 })),
      { part: drum, axis: "x" as const, speed: 2.6 },
    ],
    update,
    rest,
    frame: { camera: [7.2, 4.4, 10.2], target: [0, 1.9, 0] },
  };
}
