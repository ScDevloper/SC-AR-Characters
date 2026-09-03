import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { addMesh, type CharacterRig, type Palette } from "./kit";

/**
 * The original SC humanoid: two arms, two legs, ink-deck torso, screen face.
 * `accessory` selects the per-role add-ons (press rack, die-cut crown, ...).
 */
export function buildHumanoid(
  scene: THREE.Scene,
  palette: Palette,
  accessory: string,
): CharacterRig {
  const { metal, darkMetal, rubber, screen, paper, cyan, magenta, yellow, inkBlack, glow, film } =
    palette;
  const variant = accessory;

  const root = new THREE.Group();
  root.position.y = 0.08;
  scene.add(root);

  const torso = new THREE.Group();
  torso.position.y = 2.75;
  root.add(torso);

  addMesh(
    torso,
    new RoundedBoxGeometry(1.62, 1.52, 0.86, 5, 0.16),
    darkMetal,
    [0, 0, 0],
  );
  addMesh(
    torso,
    new RoundedBoxGeometry(1.34, 1.08, 0.22, 4, 0.08),
    rubber,
    [0, 0.07, 0.49],
  );

  const rollers: THREE.Mesh[] = [];
  for (const y of [0.42, 0.12, -0.18]) {
    rollers.push(
      addMesh(
        torso,
        new THREE.CylinderGeometry(0.105, 0.105, 1.05, 24),
        rubber,
        [0, y, 0.64],
        [0, 0, Math.PI / 2],
      ),
    );
  }
  addMesh(
    torso,
    new RoundedBoxGeometry(0.84, 0.68, 0.04, 3, 0.04),
    paper,
    [0, 0.04, 0.755],
  );
  addMesh(
    torso,
    new RoundedBoxGeometry(1.18, 0.19, 0.12, 3, 0.05),
    metal,
    [0, -0.55, 0.58],
  );

  const inkMaterials = [cyan, magenta, yellow, inkBlack];
  inkMaterials.forEach((material, index) => {
    addMesh(
      torso,
      new RoundedBoxGeometry(0.22, 0.12, 0.08, 2, 0.025),
      material,
      [-0.38 + index * 0.255, -0.55, 0.67],
    );
  });

  const head = new THREE.Group();
  head.position.y = 1.32;
  torso.add(head);
  addMesh(
    head,
    new THREE.CylinderGeometry(0.24, 0.24, 0.24, 24),
    rubber,
    [0, -0.55, 0],
  );
  addMesh(
    head,
    new RoundedBoxGeometry(1.72, 1.16, 0.94, 6, 0.24),
    metal,
    [0, 0, 0],
  );
  addMesh(
    head,
    new RoundedBoxGeometry(1.46, 0.9, 0.13, 6, 0.19),
    screen,
    [0, 0, 0.515],
  );

  for (const side of [-1, 1]) {
    addMesh(
      head,
      new THREE.CylinderGeometry(0.31, 0.31, 0.18, 32),
      darkMetal,
      [side * 0.92, 0, 0],
      [0, 0, Math.PI / 2],
    );
    addMesh(
      head,
      new THREE.TorusGeometry(0.2, 0.035, 12, 32),
      cyan,
      [side * 1.02, 0, 0],
      [0, Math.PI / 2, 0],
    );
  }

  const eyes = new THREE.Group();
  eyes.position.z = 0.6;
  head.add(eyes);
  for (const x of [-0.39, 0.39]) {
    addMesh(
      eyes,
      new THREE.SphereGeometry(0.115, 24, 16),
      glow,
      [x, 0.14, 0],
      [0, 0, 0],
    ).scale.set(1, 1.35, 0.28);
  }
  const smile = addMesh(
    eyes,
    new THREE.TorusGeometry(0.26, 0.038, 12, 32, Math.PI),
    glow,
    [0, -0.11, 0],
    [0, 0, Math.PI],
  );
  smile.scale.y = 0.55;

  if (variant === "press") {
    const cartridgeRack = new THREE.Group();
    cartridgeRack.position.set(0, 0.68, 0);
    head.add(cartridgeRack);
    inkMaterials.forEach((material, index) => {
      addMesh(
        cartridgeRack,
        new RoundedBoxGeometry(0.31, 0.55, 0.48, 3, 0.06),
        material,
        [-0.5 + index * 0.335, 0.05, -0.02],
        [-0.1, 0, 0],
      );
    });
  }

  function createArm(side: -1 | 1) {
    const upper = new THREE.Group();
    upper.position.set(side * 0.98, 0.48, 0);
    torso.add(upper);
    addMesh(
      upper,
      new THREE.SphereGeometry(0.31, 24, 16),
      darkMetal,
      [0, 0, 0],
    );
    addMesh(
      upper,
      new RoundedBoxGeometry(0.43, 0.82, 0.46, 4, 0.11),
      metal,
      [0, -0.48, 0],
    );
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.92, 0);
    upper.add(forearm);
    addMesh(
      forearm,
      new THREE.SphereGeometry(0.2, 20, 14),
      rubber,
      [0, 0, 0],
    );
    addMesh(
      forearm,
      new RoundedBoxGeometry(0.45, 0.77, 0.5, 4, 0.12),
      metal,
      [0, -0.42, 0],
    );
    addMesh(
      forearm,
      new RoundedBoxGeometry(0.42, 0.24, 0.38, 3, 0.08),
      darkMetal,
      [0, -0.89, 0.03],
    );
    for (let i = 0; i < 3; i++) {
      addMesh(
        forearm,
        new THREE.CapsuleGeometry(0.045, 0.22, 5, 10),
        rubber,
        [(i - 1) * 0.12, -1.07, 0.03],
        [0, 0, 0],
      );
    }
    return { upper, forearm };
  }

  function createLeg(side: -1 | 1) {
    const upper = new THREE.Group();
    upper.position.set(side * 0.48, 1.88, 0);
    root.add(upper);
    addMesh(
      upper,
      new THREE.SphereGeometry(0.28, 24, 16),
      darkMetal,
      [0, 0, 0],
    );
    addMesh(
      upper,
      new RoundedBoxGeometry(0.55, 0.9, 0.55, 4, 0.13),
      metal,
      [0, -0.5, 0],
    );
    const lower = new THREE.Group();
    lower.position.set(0, -1.02, 0);
    upper.add(lower);
    addMesh(
      lower,
      new THREE.SphereGeometry(0.23, 22, 14),
      rubber,
      [0, 0, 0],
    );
    addMesh(
      lower,
      new RoundedBoxGeometry(0.5, 0.82, 0.5, 4, 0.12),
      metal,
      [0, -0.48, 0],
    );
    addMesh(
      lower,
      new RoundedBoxGeometry(0.68, 0.27, 0.92, 4, 0.12),
      darkMetal,
      [0, -0.97, 0.13],
    );
    addMesh(
      lower,
      new RoundedBoxGeometry(0.48, 0.07, 0.12, 2, 0.02),
      side === -1 ? cyan : magenta,
      [0, -1.04, 0.61],
    );
    return { upper, lower };
  }

  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  if (variant === "diecut") {
    addMesh(
      head,
      new THREE.TorusGeometry(0.48, 0.09, 14, 40),
      metal,
      [0, 0.72, 0.05],
      [Math.PI / 2, 0, 0],
    );
    addMesh(
      head,
      new THREE.CylinderGeometry(0.16, 0.16, 0.22, 20),
      cyan,
      [0, 0.72, 0.05],
      [Math.PI / 2, 0, 0],
    );
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      addMesh(
        head,
        new RoundedBoxGeometry(0.11, 0.22, 0.12, 2, 0.025),
        darkMetal,
        [Math.cos(angle) * 0.55, 0.72, Math.sin(angle) * 0.55],
        [0, -angle, 0],
      );
    }
  }

  if (variant === "laminate") {
    for (const x of [-0.42, 0.42]) {
      addMesh(
        head,
        new THREE.CylinderGeometry(0.29, 0.29, 0.48, 28),
        x < 0 ? cyan : magenta,
        [x, 0.7, 0],
        [0, 0, Math.PI / 2],
      );
      addMesh(
        head,
        new THREE.CylinderGeometry(0.11, 0.11, 0.56, 20),
        darkMetal,
        [x, 0.7, 0],
        [0, 0, Math.PI / 2],
      );
    }
    addMesh(
      torso,
      new RoundedBoxGeometry(1.05, 0.7, 0.035, 3, 0.04),
      film,
      [0, 0.03, 0.79],
    );
  }

  if (variant === "quality") {
    addMesh(
      torso,
      new THREE.CylinderGeometry(0.43, 0.43, 0.22, 40),
      darkMetal,
      [0, 0.05, 0.74],
      [Math.PI / 2, 0, 0],
    );
    addMesh(
      torso,
      new THREE.TorusGeometry(0.29, 0.065, 16, 40),
      cyan,
      [0, 0.05, 0.87],
    );
    addMesh(
      torso,
      new THREE.SphereGeometry(0.19, 28, 20),
      screen,
      [0, 0.05, 0.9],
    );
    addMesh(head, new THREE.CylinderGeometry(0.055, 0.055, 0.55, 12), darkMetal, [0, 0.78, 0]);
    addMesh(head, new THREE.SphereGeometry(0.13, 20, 14), cyan, [0, 1.06, 0]);
  }

  if (variant === "carton") {
    addMesh(
      torso,
      new RoundedBoxGeometry(1.34, 1.18, 0.35, 4, 0.08),
      yellow,
      [0, 0.02, -0.62],
    );
    addMesh(
      torso,
      new RoundedBoxGeometry(0.88, 0.64, 0.12, 3, 0.05),
      yellow,
      [0, 0.05, 0.82],
    );
    for (const x of [-0.34, 0.34]) {
      addMesh(
        torso,
        new RoundedBoxGeometry(0.15, 0.72, 0.07, 2, 0.02),
        darkMetal,
        [x, 0.05, 0.9],
      );
    }
    addMesh(
      head,
      new RoundedBoxGeometry(0.72, 0.22, 0.58, 3, 0.05),
      yellow,
      [0, 0.7, 0],
      [0, 0, 0.08],
    );
  }

  if (variant === "dispatch") {
    addMesh(
      torso,
      new RoundedBoxGeometry(1.14, 1.38, 0.52, 5, 0.12),
      cyan,
      [0, 0, -0.68],
    );
    for (const side of [-1, 1]) {
      addMesh(
        head,
        new RoundedBoxGeometry(0.16, 0.62, 0.32, 3, 0.05),
        side < 0 ? cyan : magenta,
        [side * 0.52, 0.7, -0.04],
        [0, 0, side * -0.28],
      );
      addMesh(
        side < 0 ? leftLeg.lower : rightLeg.lower,
        new THREE.TorusGeometry(0.21, 0.07, 12, 28),
        rubber,
        [side * 0.32, -0.84, 0.1],
        [0, Math.PI / 2, 0],
      );
    }
  }

  if (variant === "ink") {
    torso.scale.set(0.86, 1.06, 0.94);
    head.scale.set(0.9, 0.9, 0.9);
    addMesh(
      torso,
      new THREE.SphereGeometry(0.58, 40, 28),
      film,
      [0, 0.03, 0.55],
    ).scale.set(1, 1.15, 0.48);
    addMesh(
      torso,
      new THREE.SphereGeometry(0.28, 30, 20),
      magenta,
      [-0.34, 0.15, 0.83],
    );
    addMesh(
      torso,
      new THREE.SphereGeometry(0.22, 30, 20),
      yellow,
      [0.35, -0.2, 0.85],
    );
    addMesh(
      head,
      new THREE.ConeGeometry(0.3, 0.62, 24),
      cyan,
      [0, 0.8, 0],
    );
    for (const x of [-0.48, 0, 0.48]) {
      addMesh(
        torso,
        new THREE.SphereGeometry(0.1, 20, 14),
        x < -0.1 ? magenta : x > 0.1 ? yellow : cyan,
        [x, -0.68 + Math.abs(x) * 0.3, 0.76],
      );
    }
  }

  if (variant === "paper") {
    torso.scale.set(1.12, 0.92, 0.96);
    head.scale.set(0.86, 0.86, 0.86);
    addMesh(
      torso,
      new THREE.CylinderGeometry(0.6, 0.6, 1.62, 44),
      paper,
      [0, 0.05, 0.58],
      [0, 0, Math.PI / 2],
    );
    for (const x of [-0.86, 0.86]) {
      addMesh(
        torso,
        new THREE.TorusGeometry(0.59, 0.075, 14, 42),
        cyan,
        [x, 0.05, 0.58],
        [0, Math.PI / 2, 0],
      );
    }
    const paperTail = addMesh(
      torso,
      new THREE.PlaneGeometry(0.85, 0.88, 1, 4),
      paper,
      [0, -0.62, 0.98],
      [-0.18, 0, 0],
    );
    paperTail.castShadow = false;
    addMesh(head, new THREE.CylinderGeometry(0.08, 0.08, 0.62, 16), darkMetal, [0, 0.84, 0]);
    addMesh(head, new THREE.SphereGeometry(0.14, 22, 16), magenta, [0, 1.15, 0]);
  }

  if (variant === "prepress") {
    torso.scale.set(0.78, 1.18, 0.86);
    head.scale.set(1.04, 0.82, 0.86);
    addMesh(
      torso,
      new RoundedBoxGeometry(1.1, 1.18, 0.11, 5, 0.08),
      film,
      [0, 0.02, 0.84],
    );
    for (let y = -0.35; y <= 0.35; y += 0.23) {
      addMesh(
        torso,
        new RoundedBoxGeometry(0.84, 0.025, 0.02, 2, 0.01),
        cyan,
        [0, y, 0.91],
      );
    }
    addMesh(
      head,
      new RoundedBoxGeometry(1.4, 0.12, 0.22, 3, 0.04),
      magenta,
      [0, 0.68, 0.2],
    );
    addMesh(
      torso,
      new RoundedBoxGeometry(0.34, 0.52, 0.12, 3, 0.05),
      screen,
      [0.72, 0.12, 0.6],
      [0, -0.22, 0],
    );
  }

  if (variant === "foil") {
    torso.scale.set(0.95, 1.04, 0.94);
    addMesh(
      torso,
      new RoundedBoxGeometry(1.12, 0.72, 0.11, 4, 0.07),
      cyan,
      [0, 0.05, 0.83],
    );
    addMesh(
      torso,
      new THREE.TorusKnotGeometry(0.23, 0.055, 80, 12),
      magenta,
      [0, 0.05, 0.96],
    );
    for (const x of [-0.43, 0.43]) {
      addMesh(
        head,
        new THREE.CylinderGeometry(0.27, 0.27, 0.42, 32),
        cyan,
        [x, 0.72, 0],
        [0, 0, Math.PI / 2],
      );
    }
    for (const side of [-1, 1]) {
      addMesh(
        torso,
        new RoundedBoxGeometry(0.15, 0.82, 0.42, 3, 0.05),
        cyan,
        [side * 1.02, 0.28, -0.12],
        [0, 0, side * -0.38],
      );
    }
  }

  if (variant === "glue") {
    torso.scale.set(0.9, 1.02, 0.92);
    head.scale.set(0.92, 0.9, 0.92);
    addMesh(
      torso,
      new THREE.CapsuleGeometry(0.52, 0.62, 12, 28),
      film,
      [0, 0.02, -0.62],
    );
    addMesh(
      torso,
      new THREE.CapsuleGeometry(0.21, 0.48, 10, 22),
      cyan,
      [0, 0.02, 0.78],
    );
    addMesh(
      head,
      new THREE.ConeGeometry(0.14, 0.72, 20),
      magenta,
      [0, 0.91, 0],
    );
    for (const side of [-1, 1]) {
      addMesh(
        torso,
        new THREE.TorusGeometry(0.38, 0.055, 12, 28, Math.PI * 1.45),
        darkMetal,
        [side * 0.74, -0.05, 0.05],
        [0, side * Math.PI / 2, 0],
      );
    }
  }

  if (variant === "maintenance") {
    torso.scale.set(1.04, 1.02, 1.02);
    addMesh(
      head,
      new THREE.TorusGeometry(0.76, 0.12, 14, 40),
      cyan,
      [0, 0, -0.5],
    );
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      addMesh(
        head,
        new RoundedBoxGeometry(0.18, 0.3, 0.18, 2, 0.035),
        metal,
        [Math.cos(angle) * 0.88, Math.sin(angle) * 0.88, -0.5],
        [0, 0, angle - Math.PI / 2],
      );
    }
    addMesh(
      torso,
      new THREE.TorusGeometry(0.4, 0.11, 16, 36),
      magenta,
      [0, 0.05, 0.82],
    );
    addMesh(
      torso,
      new THREE.CylinderGeometry(0.17, 0.17, 0.22, 24),
      screen,
      [0, 0.05, 0.91],
      [Math.PI / 2, 0, 0],
    );
  }

  const rest = () => {
    root.position.set(0, 0.08, 0);
    root.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    leftArm.upper.rotation.set(0, 0, -0.12);
    rightArm.upper.rotation.set(0, 0, 0.12);
    leftArm.forearm.rotation.set(0, 0, 0);
    rightArm.forearm.rotation.set(0, 0, 0);
    leftLeg.upper.rotation.set(0, 0, 0);
    rightLeg.upper.rotation.set(0, 0, 0);
    leftLeg.lower.rotation.set(0, 0, 0);
    rightLeg.lower.rotation.set(0, 0, 0);
    eyes.scale.set(1, 1, 1);
  };

  const update = ({ beat }: { t: number; beat: number; delta: number }) => {
    const alternate = Math.sin(beat);
    const snap = Math.sin(beat * 2);
    root.position.y = 0.08 + Math.abs(Math.sin(beat)) * 0.18;
    root.rotation.y = Math.sin(beat * 0.5) * 0.24;
    root.rotation.z = alternate * 0.075;
    torso.rotation.y = -Math.sin(beat * 0.5) * 0.19;
    torso.rotation.z = -alternate * 0.12;
    head.rotation.y = Math.sin(beat * 0.52 + 0.5) * 0.24;
    head.rotation.z = snap * 0.09;
    leftArm.upper.rotation.z = -1.05 - alternate * 0.55;
    rightArm.upper.rotation.z = 1.05 - alternate * 0.55;
    leftArm.upper.rotation.x = Math.sin(beat * 0.5) * 0.4;
    rightArm.upper.rotation.x = -Math.sin(beat * 0.5) * 0.4;
    leftArm.forearm.rotation.z = -0.75 + snap * 0.45;
    rightArm.forearm.rotation.z = 0.75 + snap * 0.45;
    leftLeg.upper.rotation.z = -alternate * 0.1;
    rightLeg.upper.rotation.z = alternate * 0.1;
    leftLeg.upper.rotation.x = Math.max(0, alternate) * 0.28;
    rightLeg.upper.rotation.x = Math.max(0, -alternate) * 0.28;
    leftLeg.lower.rotation.x = Math.max(0, -alternate) * 0.25;
    rightLeg.lower.rotation.x = Math.max(0, alternate) * 0.25;
    eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.5)) * 0.35;
  };

  return {
    root,
    spinners: rollers.map((part, index) => ({
      part,
      axis: "x" as const,
      speed: 1.5 + index * 0.32,
    })),
    update,
    rest,
  };
}
