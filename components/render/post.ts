import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type PostStack = {
  render: (delta: number) => void;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
};

/**
 * Bloom + ambient occlusion for the studio viewer.
 *
 * Deliberately NOT used in AR mode. `EffectComposer` renders into an opaque
 * render target, so the alpha channel that lets the camera feed show through
 * the canvas does not survive the pass chain. AR keeps the direct renderer and
 * gets its realism from the environment map and materials instead.
 */
export function createPostStack(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): PostStack {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(width, height);

  composer.addPass(new RenderPass(scene, camera));

  // Contact shading in the crevices - panel gaps, under the chassis, between
  // stacked cartons. This is what stops parts looking pasted on top of each other.
  const ao = new GTAOPass(scene, camera, width, height);
  ao.output = GTAOPass.OUTPUT.Default;
  ao.updateGtaoMaterial({
    radius: 0.32,
    distanceExponent: 1.2,
    thickness: 1.0,
    scale: 1.0,
    samples: 16,
  });
  composer.addPass(ao);

  // Only the emissive accents and glowing eyes should bloom, hence the high
  // threshold - a low one washes the whole model out.
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.5, 0.92);
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  return {
    render: (delta) => composer.render(delta),
    setSize: (w, h) => {
      composer.setSize(w, h);
      ao.setSize(w, h);
      bloom.setSize(w, h);
    },
    dispose: () => composer.dispose(),
  };
}
