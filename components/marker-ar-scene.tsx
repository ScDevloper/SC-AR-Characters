"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ArMarkerControls,
  ArSmoothedControls,
  ArToolkitContext,
  ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex.mjs";
import { createCharacter } from "@/components/characters/create-character";
import {
  attachEnvironment,
  enhanceMaterials,
  upgradeShadows,
} from "@/components/characters/realism";
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "@/components/characters/registry";

type MarkerArSceneProps = {
  variant: CharacterId;
  onTrackingChange?: (found: boolean) => void;
  onError?: (message: string) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  onVideoReady?: (video: HTMLVideoElement | null) => void;
  pausedRef?: { current: boolean };
};

/** Camera-backed marker scene. The character transform follows the printed Hiro marker. */
export function MarkerArScene({
  variant,
  onTrackingChange,
  onError,
  onCanvasReady,
  onVideoReady,
  pausedRef,
}: MarkerArSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const trackingCallbackRef = useRef(onTrackingChange);
  const errorCallbackRef = useRef(onError);

  useEffect(() => {
    trackingCallbackRef.current = onTrackingChange;
    errorCallbackRef.current = onError;
  }, [onError, onTrackingChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let stopped = false;
    let frame = 0;
    let lastVisible = false;
    const assetBase = import.meta.env.BASE_URL;
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      precision: "highp",
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "absolute inset-0 z-[1] h-full w-full";
    mount.appendChild(renderer.domElement);
    onCanvasReady?.(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdaf6ff, 0x17202b, 3.1));
    const key = new THREE.DirectionalLight(0xffffff, 5.5);
    key.position.set(3, 7, 5);
    key.castShadow = true;
    upgradeShadows(key);
    scene.add(key);
    const rim = new THREE.PointLight(CHARACTERS[variant].accent, 18, 10, 2);
    rim.position.set(-3, 4, 2);
    scene.add(rim);

    // The studio viewer already uses this reflection environment. The first
    // marker implementation omitted it, causing metallic and physical
    // materials to become dark, flat and visibly lower quality in AR.
    const releaseEnvironment = attachEnvironment(renderer, scene, 1);

    const markerRoot = new THREE.Group();
    markerRoot.matrixAutoUpdate = false;
    scene.add(markerRoot);

    const smoothRoot = new THREE.Group();
    smoothRoot.visible = false;
    scene.add(smoothRoot);

    const characterHolder = new THREE.Group();
    smoothRoot.add(characterHolder);
    const buildScene = new THREE.Scene();
    const rig = createCharacter(buildScene, variant);
    characterHolder.add(rig.root);
    enhanceMaterials(rig.root, CHARACTER_IDS.indexOf(variant) + 1);
    rig.rest();
    rig.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(rig.root);
    const height = Math.max(bounds.max.y - bounds.min.y, 0.1);
    const width = Math.max(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z, 0.1);
    const modelScale = Math.min(0.78 / height, 0.78 / width);
    characterHolder.scale.setScalar(modelScale);
    characterHolder.position.set(0, -bounds.min.y * modelScale + 0.02, 0);
    characterHolder.rotation.y = Math.PI;

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 64),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.005;
    ground.receiveShadow = true;
    smoothRoot.add(ground);

    const source = new ArToolkitSource({
      sourceType: "webcam",
      sourceWidth: 1280,
      sourceHeight: 720,
      displayWidth: window.innerWidth,
      displayHeight: window.innerHeight,
    });
    const context = new ArToolkitContext({
      cameraParametersUrl: `${assetBase}ar-data/camera_para.dat`,
      detectionMode: "mono",
      maxDetectionRate: 30,
      canvasWidth: 640,
      canvasHeight: 480,
    });

    new ArMarkerControls(context, markerRoot, {
      type: "pattern",
      patternUrl: `${assetBase}ar-data/patt.hiro`,
      changeMatrixMode: "modelViewMatrix",
      size: 1,
    });
    const smoothing = new ArSmoothedControls(smoothRoot, {
      lerpPosition: 0.55,
      lerpQuaternion: 0.45,
      lerpScale: 0.7,
      minVisibleDelay: 0.08,
      minUnvisibleDelay: 0.18,
    });

    const resize = () => {
      if (!source.domElement) return;
      source.onResizeElement();
      source.copyElementSizeTo(renderer.domElement);
      // AR.js copies CSS/video dimensions directly onto the canvas. Reapply
      // Three's DPR-aware backing resolution so the model stays sharp on
      // Retina and high-density phone screens without moving the overlay.
      const renderWidth = Math.max(renderer.domElement.clientWidth, 1);
      const renderHeight = Math.max(renderer.domElement.clientHeight, 1);
      renderer.setSize(renderWidth, renderHeight, false);
      if (context.arController) source.copyElementSizeTo(context.arController.canvas);
    };

    source.init(
      () => {
        if (stopped) return;
        const video = source.domElement as HTMLVideoElement;
        mount.prepend(video);
        Object.assign(video.style, {
          position: "absolute",
          inset: "0",
          zIndex: "0",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          margin: "0",
        });
        video.setAttribute("playsinline", "true");
        onVideoReady?.(video);
        resize();
        context.init(() => {
          if (stopped) return;
          camera.projectionMatrix.copy(context.getProjectionMatrix());
          resize();
        });
      },
      () => errorCallbackRef.current?.("Camera permission was blocked or the rear camera could not start."),
    );

    window.addEventListener("resize", resize);
    const clock = new THREE.Clock();
    const start = performance.now();
    const tempo = 2.85 + CHARACTER_IDS.indexOf(variant) * 0.12;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (source.ready && context.arController && !pausedRef?.current) {
        context.update(source.domElement);
        smoothing.update(markerRoot);
      }

      const visible = Boolean(smoothRoot.visible);
      if (visible !== lastVisible) {
        lastVisible = visible;
        trackingCallbackRef.current?.(visible);
      }
      if (visible) {
        const t = (performance.now() - start) / 1000;
        rig.update({ t, beat: t * tempo, delta });
        rig.spinners.forEach(({ part, axis, speed }) => {
          part.rotation[axis] += delta * speed;
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      source.dispose?.();
      releaseEnvironment();
      onCanvasReady?.(null);
      onVideoReady?.(null);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      mount.replaceChildren();
    };
  }, [onCanvasReady, onVideoReady, pausedRef, variant]);

  return <div ref={mountRef} className="absolute inset-0 overflow-hidden bg-black" />;
}
