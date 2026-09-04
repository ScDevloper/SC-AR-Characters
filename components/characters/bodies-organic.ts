import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { addFace, addMesh, type CharacterRig, type Palette } from "./kit";

/* ------------------------------------------------------------------ *
 * Shared helper: bend a tall geometry with a travelling sine wave.
 *
 * Both the tube dancer and the crawler flail rather than pivot, so instead of
 * joints they deform vertices directly. Cache the rest positions once, then
 * rewrite `position` each frame from that cache - never from the live buffer,
 * or the deformation compounds and the mesh drifts apart within seconds.
 * ------------------------------------------------------------------ */

function makeWaveMesh(geometry: THREE.BufferGeometry, material: THREE.Material, height: number) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  const rest = Float32Array.from(geometry.getAttribute("position").array);

  const bend = (t: number, amplitude: number, frequency: number, twist: number) => {
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const x = rest[i * 3];
      const y = rest[i * 3 + 1];
      const z = rest[i * 3 + 2];

      // 0 at the base, 1 at the tip - the wave grows as it travels upward.
      const along = THREE.MathUtils.clamp((y + height / 2) / height, 0, 1);
      const phase = t - along * frequency;
      const sway = Math.sin(phase) * amplitude * along * along;
      const lean = Math.cos(phase * 0.7) * amplitude * 0.45 * along * along;
      const spin = Math.sin(phase * 0.5) * twist * along;

      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      position.setXYZ(i, x * cos - z * sin + sway, y, x * sin + z * cos + lean);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const reset = () => {
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    position.array.set(rest);
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  return { mesh, bend, reset };
}

/* ------------------------------------------------------------------ *
 * 1. Tube - the inflatable waving dancer
 * ------------------------------------------------------------------ */

export function buildTube(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { darkMetal, rubber, cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  // Weighted base and blower, so it reads as a real inflatable.
  addMesh(root, new THREE.CylinderGeometry(0.95, 1.1, 0.42, 32), darkMetal, [0, 0.12, 0]);
  addMesh(root, new THREE.TorusGeometry(0.92, 0.07, 12, 40), cyan, [0, 0.34, 0], [Math.PI / 2, 0, 0]);
  addMesh(root, new RoundedBoxGeometry(0.7, 0.5, 0.6, 3, 0.1), rubber, [1.15, 0.22, 0]);

  const HEIGHT = 4.2;
  const fabric = new THREE.MeshPhysicalMaterial({
    color: cyan.color,
    roughness: 0.55,
    metalness: 0.02,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    sheen: 0.6,
    sheenColor: new THREE.Color(magenta.color),
    side: THREE.DoubleSide,
  });

  const tubeGeometry = new THREE.CylinderGeometry(0.34, 0.46, HEIGHT, 28, 48, true);
  const tube = makeWaveMesh(tubeGeometry, fabric, HEIGHT);
  tube.mesh.position.y = 0.34 + HEIGHT / 2;
  root.add(tube.mesh);

  // Two arm tubes that flail out of phase with the body.
  const arms = [-1, 1].map((side) => {
    const armHeight = 1.9;
    const geometry = new THREE.CylinderGeometry(0.17, 0.24, armHeight, 18, 26, true);
    const arm = makeWaveMesh(geometry, fabric, armHeight);
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.34, 0.34 + HEIGHT * 0.74, 0);
    pivot.rotation.z = side * 0.55;
    arm.mesh.position.y = armHeight / 2;
    pivot.add(arm.mesh);
    root.add(pivot);
    return { ...arm, pivot, side };
  });

  const head = new THREE.Group();
  head.position.y = 0.34 + HEIGHT;
  root.add(head);
  const dome = addMesh(head, new THREE.SphereGeometry(0.44, 28, 20), fabric, [0, 0, 0]);
  dome.scale.set(1, 1.15, 1);
  const eyes = addFace(head, palette, 0.72);
  eyes.position.z = 0.4;

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    tube.reset();
    arms.forEach((arm) => {
      arm.reset();
      arm.pivot.rotation.set(0, 0, arm.side * 0.55);
    });
    head.position.set(0, 0.34 + HEIGHT, 0);
    head.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    tube.bend(beat * 1.6, 0.85, 2.6, 0.5);
    arms.forEach((arm, index) => {
      arm.bend(beat * 2.1 + index * 2.2, 0.6, 2.2, 0.3);
      arm.pivot.rotation.z = arm.side * (0.55 + Math.sin(beat * 1.4 + index) * 0.55);
      arm.pivot.rotation.x = Math.sin(beat * 1.9 + index * 1.7) * 0.5;
    });

    // The head rides the tip of the body wave rather than sitting on an axis.
    const tip = Math.sin(beat * 1.6 - 2.6) * 0.85;
    const lean = Math.cos((beat * 1.6 - 2.6) * 0.7) * 0.38;
    head.position.set(tip, 0.34 + HEIGHT - Math.abs(tip) * 0.16, lean);
    head.rotation.z = -tip * 0.4;
    head.rotation.x = lean * 0.3;
    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat)) * 0.45;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.4, 4.2, 9.4], target: [0, 2.6, 0] } };
}

/* ------------------------------------------------------------------ *
 * 2. Crawler - segmented conveyor caterpillar
 * ------------------------------------------------------------------ */

export function buildCrawler(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { metal, darkMetal, rubber, cyan, magenta } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const SEGMENTS = 9;
  const SPACING = 0.62;
  const segments: { group: THREE.Group; home: number; wheels: THREE.Mesh[] }[] = [];

  for (let i = 0; i < SEGMENTS; i++) {
    const group = new THREE.Group();
    const home = (i - (SEGMENTS - 1) / 2) * SPACING;
    group.position.set(home, 0.55, 0);
    root.add(group);

    const taper = 1 - Math.abs(i - (SEGMENTS - 1) / 2) / SEGMENTS;
    addMesh(
      group,
      new RoundedBoxGeometry(0.56, 0.46 + taper * 0.2, 0.78 + taper * 0.2, 5, 0.12),
      i % 2 === 0 ? metal : darkMetal,
      [0, 0, 0],
    );
    addMesh(group, new RoundedBoxGeometry(0.1, 0.1, 0.86, 2, 0.04), i % 3 === 0 ? cyan : magenta, [0, 0.28, 0]);

    const wheels = [-1, 1].map((side) =>
      addMesh(
        group,
        new THREE.CylinderGeometry(0.19, 0.19, 0.14, 18),
        rubber,
        [0, -0.3, side * 0.42],
        [0, 0, Math.PI / 2],
      ),
    );
    segments.push({ group, home, wheels });
  }

  // Head on the leading segment.
  const head = new THREE.Group();
  head.position.set(0.52, 0.16, 0);
  segments[SEGMENTS - 1].group.add(head);
  addMesh(head, new RoundedBoxGeometry(0.62, 0.56, 0.8, 5, 0.16), metal, [0, 0, 0]);
  addMesh(head, new RoundedBoxGeometry(0.1, 0.38, 0.6, 3, 0.05), palette.screen, [0.3, 0.02, 0]);
  const eyes = addFace(head, palette, 0.6);
  eyes.rotation.y = Math.PI / 2;
  eyes.position.x = 0.34;

  for (const side of [-1, 1]) {
    addMesh(head, new THREE.SphereGeometry(0.05, 12, 10), palette.glow, [0.1, 0.42, side * 0.22]);
    addMesh(head, new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8), darkMetal, [0.1, 0.26, side * 0.22], [side * 0.3, 0, 0]);
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    segments.forEach(({ group, home }) => {
      group.position.set(home, 0.55, 0);
      group.rotation.set(0, 0, 0);
    });
    head.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    root.rotation.y = Math.sin(beat * 0.3) * 0.6;
    segments.forEach(({ group, home }, i) => {
      // One wave travelling tail-to-head: each segment lags the one ahead.
      const phase = beat * 1.8 - i * 0.62;
      group.position.y = 0.55 + Math.max(0, Math.sin(phase)) * 0.42;
      group.position.z = Math.sin(phase * 0.5) * 0.18;
      group.rotation.z = Math.cos(phase) * 0.26;
      group.rotation.y = Math.sin(phase * 0.5) * 0.2;
    });
    head.rotation.z = Math.sin(beat * 1.8 - (SEGMENTS - 1) * 0.62) * 0.3;
    eyes.scale.y = 0.7 + Math.abs(Math.sin(beat * 0.7)) * 0.4;
  };

  return {
    root,
    spinners: segments.flatMap(({ wheels }) =>
      wheels.map((part) => ({ part, axis: "x" as const, speed: 3.2 })),
    ),
    update,
    rest,
    frame: { camera: [5.6, 3.2, 9.2], target: [0, 1.1, 0] },
  };
}

/* ------------------------------------------------------------------ *
 * 3. Drop - liquid ink, squash and stretch, no rigid parts
 * ------------------------------------------------------------------ */

export function buildDrop(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { cyan, magenta, glow } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const ink = new THREE.MeshPhysicalMaterial({
    color: cyan.color,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transmission: 0.25,
    thickness: 1.4,
    ior: 1.42,
    iridescence: 0.5,
    iridescenceIOR: 1.6,
  });

  const body = new THREE.Group();
  body.position.y = 1.35;
  root.add(body);

  const blob = addMesh(body, new THREE.SphereGeometry(1.25, 48, 36), ink, [0, 0, 0]);
  // Teardrop tip.
  const tip = addMesh(body, new THREE.ConeGeometry(0.62, 1.1, 40), ink, [0, 1.15, 0]);
  tip.scale.set(1, 1, 1);

  const eyes = addFace(body, palette, 1.0);
  eyes.position.z = 1.16;

  // Droplets that shed on the beat.
  const droplets = [0, 1, 2].map((i) => {
    const drop = addMesh(root, new THREE.SphereGeometry(0.17 + i * 0.04, 20, 16), ink, [0, 1.3, 0]);
    return { mesh: drop, phase: i * 2.1 };
  });

  const splash = addMesh(
    root,
    new THREE.RingGeometry(0.9, 1.25, 40),
    new THREE.MeshBasicMaterial({ color: magenta.color, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
    [0, -0.9, 0],
    [-Math.PI / 2, 0, 0],
  );
  splash.castShadow = false;
  addMesh(body, new THREE.SphereGeometry(0.1, 14, 10), glow, [0, -0.9, 0.6]);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    body.position.set(0, 1.35, 0);
    body.rotation.set(0, 0, 0);
    body.scale.set(1, 1, 1);
    blob.scale.set(1, 1, 1);
    tip.scale.set(1, 1, 1);
    tip.position.set(0, 1.15, 0);
    eyes.position.set(0, 0, 1.16);
    droplets.forEach(({ mesh }) => {
      mesh.position.set(0, 1.3, 0);
      mesh.scale.setScalar(1);
    });
    splash.scale.setScalar(1);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const hop = Math.abs(Math.sin(beat));
    // Volume-preserving squash: widen exactly as much as it flattens, or the
    // blob visibly gains and loses mass on every bounce.
    const squash = 1 - Math.pow(1 - hop, 3) * 0.34;
    const spread = 1 / Math.sqrt(squash);

    body.position.y = 1.35 + hop * 0.75;
    body.scale.set(spread, squash, spread);
    body.rotation.z = Math.sin(beat * 0.5) * 0.16;
    tip.scale.set(1, 1 + (1 - hop) * 0.5, 1);
    tip.position.y = 1.15 + (1 - hop) * 0.2;

    droplets.forEach(({ mesh, phase }, i) => {
      const local = (beat * 0.6 + phase) % 6.28;
      const rise = Math.sin(local * 0.5);
      mesh.position.set(Math.cos(local + i) * (0.9 + i * 0.2), 1.3 + rise * 1.5, Math.sin(local + i) * 0.7);
      mesh.scale.setScalar(0.7 + Math.abs(rise) * 0.5);
    });

    splash.scale.setScalar(0.8 + (1 - hop) * 0.5);
    (splash.material as THREE.MeshBasicMaterial).opacity = 0.12 + (1 - hop) * 0.3;
    eyes.scale.y = 0.7 + hop * 0.4;
    eyes.position.y = -Math.pow(1 - hop, 3) * 0.15;
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.0, 3.6, 8.6], target: [0, 1.7, 0] } };
}

/* ------------------------------------------------------------------ *
 * 4. Swarm - a figure made of halftone dots
 * ------------------------------------------------------------------ */

export function buildSwarm(scene: THREE.Scene, palette: Palette): CharacterRig {
  const { cyan, magenta, yellow, inkBlack } = palette;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const COUNT = 420;
  const dummy = new THREE.Object3D();

  // Target positions: a rough figure sampled as a stack of rings.
  const targets: THREE.Vector3[] = [];
  const scatter: THREE.Vector3[] = [];
  const sizes: number[] = [];

  for (let i = 0; i < COUNT; i++) {
    const along = i / COUNT;
    // Head sphere on top, tapered body below.
    let radius: number;
    let height: number;
    if (along > 0.78) {
      const headT = (along - 0.78) / 0.22;
      radius = Math.sin(headT * Math.PI) * 0.62 + 0.08;
      height = 3.2 + headT * 1.1;
    } else {
      const bodyT = along / 0.78;
      radius = 1.05 - bodyT * 0.35 + Math.sin(bodyT * Math.PI * 2) * 0.12;
      height = bodyT * 3.2;
    }
    const angle = i * 2.399963; // golden angle, so rings do not line up
    targets.push(new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius));
    scatter.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 6.5,
        Math.random() * 5 + 0.2,
        (Math.random() - 0.5) * 6.5,
      ),
    );
    sizes.push(0.055 + Math.random() * 0.055);
  }

  // One InstancedMesh per ink, so the swarm is four draw calls, not 420.
  const inks = [cyan, magenta, yellow, inkBlack];
  const meshes = inks.map((material, inkIndex) => {
    const members = targets
      .map((_, i) => i)
      .filter((i) => i % inks.length === inkIndex);
    const mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 10, 8),
      material,
      members.length,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;
    root.add(mesh);
    return { mesh, members };
  });

  const place = (blend: number, wobble: number, t: number) => {
    meshes.forEach(({ mesh, members }) => {
      members.forEach((source, slot) => {
        const target = targets[source];
        const away = scatter[source];
        const size = sizes[source];
        const drift = Math.sin(t * 2 + source) * wobble;

        dummy.position.set(
          THREE.MathUtils.lerp(away.x, target.x, blend) + drift * 0.35,
          THREE.MathUtils.lerp(away.y, target.y, blend) + drift * 0.2,
          THREE.MathUtils.lerp(away.z, target.z, blend) + drift * 0.35,
        );
        dummy.scale.setScalar(size * (0.7 + blend * 0.6));
        dummy.rotation.set(t + source, t * 0.6, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(slot, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  };

  place(1, 0, 0);

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    place(1, 0, 0);
  };

  const update = ({ t, beat }: { t: number; beat: number; delta: number }) => {
    // Hold the figure, burst apart on the downbeat, snap back together.
    const cycle = (Math.sin(beat * 0.5) + 1) / 2;
    const blend = THREE.MathUtils.smoothstep(cycle, 0.12, 0.72);
    root.rotation.y = Math.sin(beat * 0.28) * 0.7;
    place(blend, (1 - blend) * 0.6 + 0.08, t);
  };

  return { root, spinners: [], update, rest, frame: { camera: [6.6, 4.0, 9.2], target: [0, 2.2, 0] } };
}
