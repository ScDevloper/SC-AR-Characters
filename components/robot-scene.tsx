"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Maximize2, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Rig = {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftLowerLeg: THREE.Group;
  rightLowerLeg: THREE.Group;
  eyes: THREE.Group;
  rollers: THREE.Mesh[];
};

export type RobotVariant =
  | "press"
  | "diecut"
  | "laminate"
  | "quality"
  | "carton"
  | "dispatch"
  | "ink"
  | "paper"
  | "prepress"
  | "foil"
  | "glue"
  | "maintenance";

export const ROBOT_VARIANTS: Record<
  RobotVariant,
  {
    name: string;
    shortName: string;
    role: string;
    code: string;
    accent: number;
    secondary: number;
    dance: string;
  }
> = {
  press: {
    name: "PressBot",
    shortName: "Press",
    role: "Printing press operator",
    code: "PRESS-01",
    accent: 0x19d9ff,
    secondary: 0xff2e8c,
    dance: "Roller groove",
  },
  diecut: {
    name: "CutBot",
    shortName: "Die-cut",
    role: "Precision die-cutting unit",
    code: "CUT-02",
    accent: 0xff8a1f,
    secondary: 0xffd84a,
    dance: "Cutter twist",
  },
  laminate: {
    name: "LamiBot",
    shortName: "Laminate",
    role: "Lamination specialist",
    code: "LAMI-03",
    accent: 0x2ee6a6,
    secondary: 0x55a7ff,
    dance: "Film-flow disco",
  },
  quality: {
    name: "Q-Bot",
    shortName: "Quality",
    role: "Quality inspection scanner",
    code: "QC-04",
    accent: 0xa879ff,
    secondary: 0x19d9ff,
    dance: "Scanner swing",
  },
  carton: {
    name: "PackBot",
    shortName: "Carton",
    role: "Carton forming assistant",
    code: "PACK-05",
    accent: 0xffd84a,
    secondary: 0xff6a3d,
    dance: "Boxy bounce",
  },
  dispatch: {
    name: "DashBot",
    shortName: "Dispatch",
    role: "Finished-goods courier",
    code: "SHIP-06",
    accent: 0x4c8dff,
    secondary: 0x2ee6a6,
    dance: "Delivery shuffle",
  },
  ink: {
    name: "Inky",
    shortName: "Ink",
    role: "Ink-room colour mixer",
    code: "INK-07",
    accent: 0x00cfff,
    secondary: 0xff2e8c,
    dance: "Colour splash",
  },
  paper: {
    name: "Rollie",
    shortName: "Paper",
    role: "Paper-roll handling unit",
    code: "ROLL-08",
    accent: 0xe8f4ff,
    secondary: 0x4c8dff,
    dance: "Roll and rock",
  },
  prepress: {
    name: "Pixel",
    shortName: "Prepress",
    role: "Prepress and plate assistant",
    code: "PLATE-09",
    accent: 0x38bdf8,
    secondary: 0x8b5cf6,
    dance: "Pixel pop",
  },
  foil: {
    name: "Foilio",
    shortName: "Foil",
    role: "Foil-stamping specialist",
    code: "FOIL-10",
    accent: 0xffc83d,
    secondary: 0xff6b35,
    dance: "Golden glide",
  },
  glue: {
    name: "Glu-Bug",
    shortName: "Gluing",
    role: "Folding and gluing helper",
    code: "GLUE-11",
    accent: 0x67e8a5,
    secondary: 0xf472b6,
    dance: "Sticky step",
  },
  maintenance: {
    name: "Gearo",
    shortName: "Maintenance",
    role: "Engineering maintenance mate",
    code: "GEAR-12",
    accent: 0xfb7185,
    secondary: 0xfbbf24,
    dance: "Gear grind",
  },
};

const YELLOW = 0xffd84a;
const BLACK = 0x111419;

function addMesh(
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

function createRobot(scene: THREE.Scene, variant: RobotVariant): Rig {
  const config = ROBOT_VARIANTS[variant];
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
    color: config.accent,
    emissive: config.accent,
    emissiveIntensity: 1.5,
    metalness: 0.32,
    roughness: 0.24,
  });
  const magenta = cyan.clone();
  magenta.color.setHex(config.secondary);
  magenta.emissive.setHex(config.secondary);
  const yellow = cyan.clone();
  yellow.color.setHex(YELLOW);
  yellow.emissive.setHex(0x6a4c00);
  const inkBlack = cyan.clone();
  inkBlack.color.setHex(BLACK);
  inkBlack.emissive.setHex(0x020303);
  const glow = new THREE.MeshBasicMaterial({ color: 0xc9f7ff });
  const film = new THREE.MeshPhysicalMaterial({
    color: config.accent,
    transparent: true,
    opacity: 0.24,
    transmission: 0.72,
    roughness: 0.08,
    metalness: 0,
    side: THREE.DoubleSide,
  });

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

  return {
    root,
    torso,
    head,
    leftArm: leftArm.upper,
    rightArm: rightArm.upper,
    leftForearm: leftArm.forearm,
    rightForearm: rightArm.forearm,
    leftLeg: leftLeg.upper,
    rightLeg: rightLeg.upper,
    leftLowerLeg: leftLeg.lower,
    rightLowerLeg: rightLeg.lower,
    eyes,
    rollers,
  };
}

export function RobotScene({ variant }: { variant: RobotVariant }) {
  const variantInfo = ROBOT_VARIANTS[variant];
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef({ dancing: true, start: 0 });
  const resetRef = useRef<(() => void) | null>(null);
  const [dancing, setDancing] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x071018, 0.035);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(6.7, 4.6, 9.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6.5;
    controls.maxDistance = 15;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.54;
    controls.target.set(0, 2.45, 0);

    scene.add(new THREE.HemisphereLight(0xbfeaff, 0x10131a, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4.6);
    key.position.set(5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -3;
    scene.add(key);

    const rim = new THREE.PointLight(variantInfo.accent, 22, 18, 2);
    rim.position.set(-5, 4, -2);
    scene.add(rim);
    const pinkRim = new THREE.PointLight(variantInfo.secondary, 15, 15, 2);
    pinkRim.position.set(5, 2.5, -1);
    scene.add(pinkRim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6.6, 96),
      new THREE.MeshStandardMaterial({
        color: 0x0a1118,
        metalness: 0.25,
        roughness: 0.58,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.94;
    floor.receiveShadow = true;
    scene.add(floor);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: variantInfo.accent,
      transparent: true,
      opacity: 0.3,
    });
    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.13, 96),
      ringMaterial,
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -0.925;
    scene.add(floorRing);

    const rig = createRobot(scene, variant);
    const clock = new THREE.Clock();
    animationRef.current.start = performance.now();

    const resetPose = () => {
      rig.root.position.set(0, 0.08, 0);
      rig.root.rotation.set(0, 0, 0);
      rig.torso.rotation.set(0, 0, 0);
      rig.head.rotation.set(0, 0, 0);
      rig.leftArm.rotation.set(0, 0, -0.12);
      rig.rightArm.rotation.set(0, 0, 0.12);
      rig.leftForearm.rotation.set(0, 0, 0);
      rig.rightForearm.rotation.set(0, 0, 0);
      rig.leftLeg.rotation.set(0, 0, 0);
      rig.rightLeg.rotation.set(0, 0, 0);
      rig.leftLowerLeg.rotation.set(0, 0, 0);
      rig.rightLowerLeg.rotation.set(0, 0, 0);
      camera.position.set(6.7, 4.6, 9.4);
      controls.target.set(0, 2.45, 0);
      controls.update();
    };
    resetPose();
    resetRef.current = resetPose;

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = (performance.now() - animationRef.current.start) / 1000;

      if (animationRef.current.dancing) {
        const variantIndex = Object.keys(ROBOT_VARIANTS).indexOf(variant);
        const beat = t * (2.85 + variantIndex * 0.12);
        const alternate = Math.sin(beat);
        const snap = Math.sin(beat * 2);
        rig.root.position.y = 0.08 + Math.abs(Math.sin(beat)) * 0.18;
        rig.root.rotation.y = Math.sin(beat * 0.5) * (0.2 + variantIndex * 0.018);
        rig.root.rotation.z = alternate * 0.075;
        rig.torso.rotation.y = -Math.sin(beat * 0.5) * 0.19;
        rig.torso.rotation.z = -alternate * 0.12;
        rig.head.rotation.y = Math.sin(beat * 0.52 + 0.5) * 0.24;
        rig.head.rotation.z = snap * 0.09;
        rig.leftArm.rotation.z = -1.05 - alternate * (0.48 + variantIndex * 0.035);
        rig.rightArm.rotation.z = 1.05 - alternate * (0.48 + variantIndex * 0.035);
        rig.leftArm.rotation.x = Math.sin(beat * 0.5) * 0.4;
        rig.rightArm.rotation.x = -Math.sin(beat * 0.5) * 0.4;
        rig.leftForearm.rotation.z = -0.75 + snap * 0.45;
        rig.rightForearm.rotation.z = 0.75 + snap * 0.45;
        rig.leftLeg.rotation.z = -alternate * 0.1;
        rig.rightLeg.rotation.z = alternate * 0.1;
        rig.leftLeg.rotation.x = Math.max(0, alternate) * 0.28;
        rig.rightLeg.rotation.x = Math.max(0, -alternate) * 0.28;
        rig.leftLowerLeg.rotation.x = Math.max(0, -alternate) * 0.25;
        rig.rightLowerLeg.rotation.x = Math.max(0, alternate) * 0.25;
        rig.eyes.scale.y = 0.75 + Math.abs(Math.sin(beat * 0.5)) * 0.35;
      }

      rig.rollers.forEach((roller, index) => {
        roller.rotation.x += delta * (1.5 + index * 0.32);
      });
      floorRing.rotation.z -= delta * 0.15;
      ringMaterial.opacity = 0.2 + Math.sin(t * 2.4) * 0.08;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
      resetRef.current = null;
    };
  }, [variant, variantInfo.accent, variantInfo.secondary]);

  const toggleDance = () => {
    const next = !dancing;
    setDancing(next);
    animationRef.current.dancing = next;
    if (next) animationRef.current.start = performance.now();
  };

  const reset = () => {
    animationRef.current.start = performance.now();
    resetRef.current?.();
  };

  const fullscreen = async () => {
    if (!document.fullscreenElement) {
      await mountRef.current?.parentElement?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <section className="robot-stage" aria-label="Interactive 3D robot viewer">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
        <div className="stage-badge">
          <span className="status-pulse" />
          Live 3D
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">{variantInfo.name}</p>
          <p className="mt-1 text-xs text-slate-400">{variantInfo.code} · {variantInfo.dance}</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
        <div className="control-dock">
          <Button
            type="button"
            onClick={toggleDance}
            className="h-11 rounded-full bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200"
          >
            {dancing ? <Pause /> : <Play />}
            {dancing ? "Pause dance" : "Funny dance"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={reset}
            aria-label="Reset character and camera"
            className="rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={fullscreen}
            aria-label="Open full screen"
            className="rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            <Maximize2 />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-24 left-4 hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-slate-300 backdrop-blur-md md:flex">
        <Sparkles className="size-3.5 text-yellow-300" />
        Browser-native model
      </div>
    </section>
  );
}
