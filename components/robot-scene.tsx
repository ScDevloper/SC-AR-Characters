"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Maximize2, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addBrandBadge, createPalette, type CharacterRig } from "@/components/characters/kit";
import { buildHumanoid } from "@/components/characters/humanoid";
import {
  buildArm,
  buildDrone,
  buildQuad,
  buildRoll,
  buildRover,
  buildStack,
} from "@/components/characters/bodies";
import {
  buildCutter,
  buildForklift,
  buildGlueLine,
  buildMixer,
  buildPalletTrolley,
  buildPlatesetter,
  buildRack,
  buildSampleTrolley,
  buildStamper,
  buildTruck,
  buildVault,
} from "@/components/characters/bodies-vehicles";
import {
  buildGantry,
  buildKiosk,
  buildOrb,
  buildPress,
} from "@/components/characters/bodies-machines";
import {
  buildCrawler,
  buildDrop,
  buildSwarm,
  buildTube,
} from "@/components/characters/bodies-organic";
import {
  attachEnvironment,
  enhanceMaterials,
  upgradeShadows,
} from "@/components/characters/realism";
import { createPostStack, type PostStack } from "@/components/render/post";
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "@/components/characters/registry";
import {
  ANCHOR_DISTANCE_K,
  ANCHOR_GRACE_MS,
  AR_MAX_SCREEN_FRACTION,
  AR_TARGET_SIZE,
  type MarkerAnchor,
} from "@/components/characters/anchor";

// Re-exported so existing imports (`ROBOT_VARIANTS`, `RobotVariant`) keep working.
export {
  CHARACTERS as ROBOT_VARIANTS,
  CHARACTER_IDS,
  isCharacterId,
  hex,
} from "@/components/characters/registry";
export type RobotVariant = CharacterId;

const DEFAULT_CAMERA: [number, number, number] = [6.7, 4.6, 9.4];
const DEFAULT_TARGET: [number, number, number] = [0, 2.45, 0];

function createCharacter(scene: THREE.Scene, id: CharacterId): CharacterRig {
  const config = CHARACTERS[id];
  const palette = createPalette(config.accent, config.secondary);

  switch (config.body) {
    case "rover":
      return buildRover(scene, palette);
    case "drone":
      return buildDrone(scene, palette);
    case "roll":
      return buildRoll(scene, palette);
    case "stack":
      return buildStack(scene, palette);
    case "arm":
      return buildArm(scene, palette);
    case "quad":
      return buildQuad(scene, palette);
    case "tube":
      return buildTube(scene, palette);
    case "crawler":
      return buildCrawler(scene, palette);
    case "drop":
      return buildDrop(scene, palette);
    case "swarm":
      return buildSwarm(scene, palette);
    case "press":
      return buildPress(scene, palette);
    case "kiosk":
      return buildKiosk(scene, palette);
    case "orb":
      return buildOrb(scene, palette);
    case "gantry":
      return buildGantry(scene, palette);
    case "truck":
      return buildTruck(scene, palette);
    case "pallet":
      return buildPalletTrolley(scene, palette);
    case "forklift":
      return buildForklift(scene, palette);
    case "cutter":
      return buildCutter(scene, palette);
    case "mixer":
      return buildMixer(scene, palette);
    case "glueline":
      return buildGlueLine(scene, palette);
    case "stamper":
      return buildStamper(scene, palette);
    case "platesetter":
      return buildPlatesetter(scene, palette);
    case "rack":
      return buildRack(scene, palette);
    case "vault":
      return buildVault(scene, palette);
    case "trolley":
      return buildSampleTrolley(scene, palette);
    case "humanoid":
    default:
      return buildHumanoid(scene, palette, id);
  }
}

export function RobotScene({
  variant,
  arMode = false,
  minimal = false,
  realistic = true,
  onCanvasReady,
  anchorRef,
}: {
  variant: CharacterId;
  arMode?: boolean;
  minimal?: boolean;
  /** Environment lighting, PBR tuning and (studio only) bloom + AO. */
  realistic?: boolean;
  /** Receives the WebGL canvas so the parent can composite it into a photo. */
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  /**
   * Live marker reading. A ref rather than a prop so scanner updates never
   * re-render this component - a new anchor object every frame would tear the
   * whole three.js scene down and rebuild it.
   */
  anchorRef?: { current: MarkerAnchor | null };
}) {
  const variantInfo = CHARACTERS[variant];
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef({ dancing: true, start: 0 });
  const resetRef = useRef<(() => void) | null>(null);
  const [dancing, setDancing] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = arMode ? null : new THREE.FogExp2(0x071018, 0.035);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // Without this the drawing buffer is cleared after compositing and any
      // readback (toDataURL / drawImage) comes out black.
      preserveDrawingBuffer: arMode,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    onCanvasReady?.(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6.5;
    controls.maxDistance = 15;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.54;

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

    let releaseEnvironment: (() => void) | null = null;
    if (realistic) {
      releaseEnvironment = attachEnvironment(renderer, scene, arMode ? 1.0 : 0.85);
      upgradeShadows(key);
    }

    const rim = new THREE.PointLight(variantInfo.accent, 22, 18, 2);
    rim.position.set(-5, 4, -2);
    scene.add(rim);
    const pinkRim = new THREE.PointLight(variantInfo.secondary, 15, 15, 2);
    pinkRim.position.set(5, 2.5, -1);
    scene.add(pinkRim);

    // In AR the character hangs off an anchor group so it can be driven to
    // wherever the QR code appears in frame. `stand` lifts the model so its
    // feet, not its centre, sit on the anchor point.
    const anchorGroup = new THREE.Group();
    const stand = new THREE.Group();
    stand.position.y = 0.94;
    anchorGroup.add(stand);
    if (arMode) scene.add(anchorGroup);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6.6, 96),
      arMode
        ? new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.3 })
        : new THREE.MeshStandardMaterial({
            color: 0x0a1118,
            metalness: 0.25,
            roughness: 0.58,
          }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.94;
    floor.receiveShadow = true;
    if (arMode) stand.add(floor);
    else scene.add(floor);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: variantInfo.accent,
      transparent: true,
      opacity: arMode ? 0.5 : 0.3,
    });
    const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.13, 96), ringMaterial);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -0.925;
    if (arMode) stand.add(floorRing);
    else scene.add(floorRing);

    let arHeight = 1;
    const rig = createCharacter(scene, variant);

    // Auto-rotation lives on a wrapper: several characters animate their own
    // root.rotation.y, and writing to it here would cancel their choreography.
    const turntable = new THREE.Group();
    (arMode ? stand : scene).add(turntable);
    turntable.add(rig.root);

    // Deterministic per-character spin so no two neighbouring codes turn alike.
    const spinIndex = CHARACTER_IDS.indexOf(variant);
    const spinSpeed = (0.2 + (spinIndex % 4) * 0.055) * (spinIndex % 2 === 0 ? 1 : -1);

    if (arMode) {

      // Characters are authored at whatever height suited the studio viewer,
      // so normalise before the marker distance is applied - and seat the feet
      // exactly on the anchor rather than assuming a fixed floor offset.
      rig.rest();
      rig.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(rig.root);
      const extent = bounds.getSize(new THREE.Vector3());
      const largest = Math.max(extent.x, extent.y, extent.z, 0.001);
      const fit = AR_TARGET_SIZE / largest;
      stand.scale.setScalar(fit);
      stand.position.y = -bounds.min.y * fit;
      // The screen clamp needs the character's real scaled height, which is
      // not AR_TARGET_SIZE unless the body happens to be tallest on Y.
      arHeight = Math.max(extent.y * fit, 0.001);
    }
    if (realistic) enhanceMaterials(rig.root, CHARACTER_IDS.indexOf(variant) + 1);
    const cameraHome = rig.frame?.camera ?? DEFAULT_CAMERA;
    const targetHome = rig.frame?.target ?? DEFAULT_TARGET;
    rig.rest();
    rig.root.updateMatrixWorld(true);
    const characterBounds = new THREE.Box3().setFromObject(rig.root);
    const characterTop = Number.isFinite(characterBounds.max.y)
      ? characterBounds.max.y
      : targetHome[1] + 2;
    const floatingBrandHome = new THREE.Vector3(0, characterTop + 1.05, -0.3);
    const floatingBrand = addBrandBadge(scene, {
      position: [floatingBrandHome.x, floatingBrandHome.y, floatingBrandHome.z],
      size: [3.05, 0.95],
      depth: 0.2,
      accent: variantInfo.accent,
    });
    const anchorTarget = new THREE.Vector3();
    let anchorFit = 1;
    const clock = new THREE.Clock();
    animationRef.current.start = performance.now();

    const resetPose = () => {
      rig.rest();
      turntable.rotation.y = 0;
      camera.position.set(...cameraHome);
      controls.target.set(...targetHome);
      controls.update();
    };
    resetPose();
    resetRef.current = resetPose;

    // Bloom and AO render through an opaque target, which would destroy the
    // alpha that lets the camera feed show through - studio mode only.
    let post: PostStack | null = null;
    if (realistic && !arMode) {
      post = createPostStack(
        renderer,
        scene,
        camera,
        Math.max(mount.clientWidth, 1),
        Math.max(mount.clientHeight, 1),
      );
    }

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      post?.setSize(Math.max(clientWidth, 1), Math.max(clientHeight, 1));
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const tempo = 2.85 + CHARACTER_IDS.indexOf(variant) * 0.12;

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = (performance.now() - animationRef.current.start) / 1000;

      if (animationRef.current.dancing) {
        rig.update({ t, beat: t * tempo, delta });
      }

      rig.spinners.forEach(({ part, axis, speed }) => {
        part.rotation[axis] += delta * speed;
      });
      if (animationRef.current.dancing) turntable.rotation.y += delta * spinSpeed;
      floorRing.rotation.z -= delta * 0.15;
      ringMaterial.opacity = 0.2 + Math.sin(t * 2.4) * 0.08;
      controls.update();
      if (floatingBrand) {
        floatingBrand.position.y = floatingBrandHome.y + Math.sin(t * 1.15) * 0.045;
        floatingBrand.lookAt(camera.position);
      }
      if (arMode && anchorRef) {
        const anchor = anchorRef.current;
        if (anchor && performance.now() - anchor.at < ANCHOR_GRACE_MS) {
          // Apparent marker size stands in for distance: a code filling more
          // of the frame is closer, so the character is placed nearer.
          const distance = THREE.MathUtils.clamp(
            ANCHOR_DISTANCE_K / Math.max(anchor.scale, 0.02),
            5,
            30,
          );
          anchorTarget
            .set(anchor.x * 2 - 1, -(anchor.y * 2 - 1), 0.5)
            .unproject(camera)
            .sub(camera.position)
            .normalize()
            .multiplyScalar(distance)
            .add(camera.position);

          // ZXing decodes a handful of times a second, not once per frame, so
          // everything is eased - without this the character teleports.
          anchorGroup.position.lerp(anchorTarget, 0.16);
          anchorGroup.rotation.z += (-anchor.roll - anchorGroup.rotation.z) * 0.12;

          // How tall the frustum is at that distance, so we can cap the
          // character's share of the screen no matter how close the code gets.
          const visibleHeight =
            2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
          const ceiling = (visibleHeight * AR_MAX_SCREEN_FRACTION) / arHeight;
          anchorFit += (Math.min(1, ceiling) - anchorFit) * 0.16;
          anchorGroup.scale.setScalar(anchorFit);

          anchorGroup.visible = true;
        } else if (anchor) {
          anchorGroup.visible = false;
        }
      }

      if (post) post.render(delta);
      else renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      post?.dispose();
      releaseEnvironment?.();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
      onCanvasReady?.(null);
      resetRef.current = null;
    };
  }, [arMode, realistic, variant, variantInfo.accent, variantInfo.secondary, onCanvasReady, anchorRef]);

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
    <section className={`robot-stage ${arMode ? "robot-stage--ar" : ""} ${minimal ? "robot-stage--minimal" : ""}`} aria-label={arMode ? "Augmented reality character viewer" : "Interactive 3D character viewer"}>
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
        <div className="stage-badge">
          <span className="status-pulse" />
          {arMode ? "AR camera" : "Live 3D"}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">{variantInfo.name}</p>
          <p className="mt-1 text-xs text-slate-400">
            {variantInfo.code} · {variantInfo.dance}
          </p>
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
        {arMode ? "Drag to position · Pinch to resize" : "Browser-native model"}
      </div>
    </section>
  );
}
