import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * A metal surface renders by reflecting its surroundings. With no
 * `scene.environment` set, a `metalness: 0.82` material has nothing to reflect
 * and resolves to near-black, which is why the characters read as flat plastic.
 *
 * `RoomEnvironment` is a procedural studio box that ships with three, so this
 * costs no downloaded assets. Generate it once, reuse the texture, dispose on
 * teardown.
 */
export function attachEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  intensity = 0.85,
) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const room = new RoomEnvironment();
  const target = pmrem.fromScene(room, 0.04);

  scene.environment = target.texture;
  scene.environmentIntensity = intensity;

  room.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  pmrem.dispose();

  return () => {
    scene.environment = null;
    target.dispose();
  };
}

/**
 * Second half of the realism pass: vary the surface properties so nothing is
 * uniformly polished. Real machines have dulled edges, fingerprinted panels and
 * a clearcoat on painted parts - uniform roughness is the main thing that reads
 * as "CG" even once reflections are present.
 */
export function enhanceMaterials(root: THREE.Object3D, seed = 1) {
  let index = seed;
  const seen = new Set<THREE.Material>();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (seen.has(material)) return;
      seen.add(material);
      index += 1;

      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMapIntensity = material.metalness > 0.5 ? 1.15 : 0.7;
        // Deterministic jitter so two panels never share an identical finish.
        const jitter = ((Math.sin(index * 12.9898) * 43758.5453) % 1) * 0.06;
        material.roughness = THREE.MathUtils.clamp(material.roughness + jitter, 0.05, 0.95);
      }

      if (material instanceof THREE.MeshPhysicalMaterial) {
        material.clearcoat = Math.max(material.clearcoat, 0.35);
        material.clearcoatRoughness = Math.min(material.clearcoatRoughness || 0.2, 0.25);
      }
    });
  });
}

/** Softer, higher-resolution shadows for the realistic mode. */
export function upgradeShadows(light: THREE.DirectionalLight) {
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.radius = 3;
  light.shadow.blurSamples = 16;
  light.shadow.bias = -0.0006;
  light.shadow.normalBias = 0.02;
}
