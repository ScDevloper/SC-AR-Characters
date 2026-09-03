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
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "@/components/characters/registry";

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
    case "humanoid":
    default:
      return buildHumanoid(scene, palette, id);
  }
}

export function RobotScene({ variant, arMode = false }: { variant: CharacterId; arMode?: boolean }) {
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

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

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
    scene.add(floor);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: variantInfo.accent,
      transparent: true,
      opacity: arMode ? 0.5 : 0.3,
    });
    const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.13, 96), ringMaterial);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -0.925;
    scene.add(floorRing);

    const rig = createCharacter(scene, variant);
    const cameraHome = rig.frame?.camera ?? DEFAULT_CAMERA;
    const targetHome = rig.frame?.target ?? DEFAULT_TARGET;
    const floatingBrandHome = new THREE.Vector3(0, targetHome[1] + 2.75, -0.35);
    const floatingBrand = addBrandBadge(scene, {
      position: [floatingBrandHome.x, floatingBrandHome.y, floatingBrandHome.z],
      size: [3.15, 0.98],
    });
    const clock = new THREE.Clock();
    animationRef.current.start = performance.now();

    const resetPose = () => {
      rig.rest();
      camera.position.set(...cameraHome);
      controls.target.set(...targetHome);
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
      floorRing.rotation.z -= delta * 0.15;
      ringMaterial.opacity = 0.2 + Math.sin(t * 2.4) * 0.08;
      controls.update();
      if (floatingBrand) {
        floatingBrand.position.y = floatingBrandHome.y + Math.sin(t * 1.15) * 0.07;
        floatingBrand.lookAt(camera.position);
      }
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
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
      resetRef.current = null;
    };
  }, [arMode, variant, variantInfo.accent, variantInfo.secondary]);

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
    <section className={`robot-stage ${arMode ? "robot-stage--ar" : ""}`} aria-label={arMode ? "Augmented reality character viewer" : "Interactive 3D character viewer"}>
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
