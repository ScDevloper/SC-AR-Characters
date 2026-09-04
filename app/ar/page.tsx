"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Download,
  QrCode,
  RefreshCcw,
  Lock,
  ScanLine,
  Share2,
  Unlock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { anchorFromPoints, type MarkerAnchor } from "@/components/characters/anchor";
import { RobotScene } from "@/components/robot-scene";
import {
  CHARACTERS,
  CHARACTER_IDS,
  hex,
  characterFromNumber,
  isCharacterId,
  type CharacterId,
} from "@/components/characters/registry";

type CameraState = "ready" | "starting" | "scanning" | "placed" | "error";

// The GitHub Pages bundle mounts this page alone under /SC-AR-Characters/,
// so "/" and "/qr" do not exist there. Hide those links when we are not at
// the site root rather than shipping links that 404.
const BASE = import.meta.env.BASE_URL;
const STANDALONE = BASE !== "/";

function characterFromQr(value: string): CharacterId | null {
  const raw = value.trim();
  if (isCharacterId(raw)) return raw;
  // A bare number is the shortest possible payload.
  const bare = characterFromNumber(raw);
  if (bare) return bare;

  try {
    const url = new URL(raw, window.location.origin);
    // `?m=7` is the short form printed on the codes; `?model=press` is kept so
    // any sheet already printed keeps working.
    const short = characterFromNumber(url.searchParams.get("m"));
    if (short) return short;
    const model = url.searchParams.get("model");
    if (isCharacterId(model)) return model;
    // Path form, served through the 404 fallback: /ar/7
    const tail = url.pathname.split("/").filter(Boolean).pop();
    return characterFromNumber(tail);
  } catch {
    return null;
  }
}

export default function ArPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("ready");
  const [message, setMessage] = useState("Scan a character QR or choose one below.");
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const anchorRef = useRef<MarkerAnchor | null>(null);
  // A ref, not state: the ZXing callback closes over the render that created
  // it, so a state value read inside it would be permanently stale.
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  // Must be stable: RobotScene lists it as an effect dependency, so a new
  // function identity each render would tear down and rebuild the scene.
  const handleCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    glRef.current = canvas;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const model =
      characterFromNumber(params.get("m")) ??
      (isCharacterId(params.get("model")) ? (params.get("model") as CharacterId) : null) ??
      characterFromNumber(window.location.pathname.split("/").filter(Boolean).pop());
    if (model) {
      setSelected(model);
      handledRef.current = true;
      setMessage(`${CHARACTERS[model].name} is ready for AR.`);
    }

    return () => controlsRef.current?.stop();
  }, []);

  const selectCharacter = (id: CharacterId) => {
    setSelected(id);
    handledRef.current = true;
    setCameraState((current) => (current === "scanning" || current === "placed" ? "placed" : "ready"));
    setMessage(`${CHARACTERS[id].name} selected.`);
    const url = new URL(window.location.href);
    url.searchParams.set("model", id);
    window.history.replaceState({}, "", url);
  };

  const startCamera = async () => {
    if (!videoRef.current || cameraState === "starting") return;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraState("starting");
    setMessage(selected ? "Opening the rear camera…" : "Opening the rear camera for QR scanning…");

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      // Scan continuously rather than once: every decode refreshes the
      // marker position, which is what keeps the character on the code.
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 40,
        delayBetweenScanSuccess: 40,
      });

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result) => {
          // While locked we skip the tracking work but leave the reader
          // running: controls.stop() calls cleanVideoSource(), which nulls
          // video.srcObject and would black out the feed we need for photos.
          if (!result || lockedRef.current) return;
          const id = characterFromQr(result.getText());
          if (!id) {
            if (!handledRef.current) {
              setMessage("That QR is not an SC character code. Try another one.");
            }
            return;
          }

          // Track on every decode, including after the character is chosen.
          const video = videoRef.current;
          const gl = glRef.current;
          if (video && gl) {
            const reading = anchorFromPoints(
              result.getResultPoints(),
              video,
              gl.clientWidth,
              gl.clientHeight,
            );
            if (reading) anchorRef.current = reading;
          }

          if (handledRef.current) return;
          handledRef.current = true;
          selectCharacter(id);
        },
      );

      controlsRef.current = controls;
      setCameraState(selected ? "placed" : "scanning");
      setMessage(selected ? `${CHARACTERS[selected].name} is now in your camera view.` : "Point the camera at an SC character QR.");
    } catch (error) {
      const reason = error instanceof Error ? error.name : "CameraError";
      setCameraState("error");
      setMessage(
        reason === "NotAllowedError"
          ? "Camera permission was blocked. Allow camera access in your browser settings and try again."
          : "The camera could not start. Use HTTPS on a phone, or choose a character manually.",
      );
    }
  };

  const scanAnother = () => {
    setSelected(null);
    handledRef.current = false;
    setCameraState("scanning");
    setMessage("Point the camera at another SC character QR.");
    const url = new URL(window.location.href);
    url.searchParams.delete("model");
    window.history.replaceState({}, "", url);
  };

  const stopCamera = () => {
    lockedRef.current = false;
    setLocked(false);
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("ready");
    setMessage(selected ? `${CHARACTERS[selected].name} is ready for AR.` : "Camera stopped.");
  };

  const toggleLock = () => {
    const next = !lockedRef.current;
    lockedRef.current = next;
    setLocked(next);
    setMessage(
      next
        ? "Locked. Point the camera anywhere and take your photo."
        : "Tracking again - aim at the code.",
    );
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const gl = glRef.current;
    if (!gl || !selected) return;

    const scale = Math.min(window.devicePixelRatio, 2);
    const width = Math.round(gl.clientWidth * scale);
    const height = Math.round(gl.clientHeight * scale);
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (video && video.videoWidth > 0) {
      // Cover-fit the camera frame so the photo matches what is on screen.
      const videoAspect = video.videoWidth / video.videoHeight;
      const boxAspect = width / height;
      const drawWidth = videoAspect > boxAspect ? height * videoAspect : width;
      const drawHeight = videoAspect > boxAspect ? height : width / videoAspect;
      ctx.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = "#050a0f";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(gl, 0, 0, width, height);

    const character = CHARACTERS[selected];
    const strip = 92 * scale;
    ctx.fillStyle = "rgba(5, 10, 15, 0.74)";
    ctx.fillRect(0, height - strip, width, strip);
    ctx.fillStyle = hex(character.accent);
    ctx.fillRect(0, height - strip, width, 4 * scale);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${26 * scale}px system-ui, sans-serif`;
    ctx.fillText(character.name, 24 * scale, height - 48 * scale);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${18 * scale}px system-ui, sans-serif`;
    ctx.fillText(`${character.code} · SC Printing`, 24 * scale, height - 20 * scale);

    setPhoto(canvas.toDataURL("image/jpeg", 0.92));
  };

  const savePhoto = () => {
    if (!photo || !selected) return;
    const link = document.createElement("a");
    link.href = photo;
    link.download = `sc-${selected}-${Date.now()}.jpg`;
    link.click();
  };

  const sharePhoto = async () => {
    if (!photo || !selected) return;
    try {
      const blob = await (await fetch(photo)).blob();
      const file = new File([blob], `sc-${selected}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${CHARACTERS[selected].name} · SC Printing` });
        return;
      }
    } catch {
      // Share sheet dismissed or unsupported - fall back to a download.
    }
    savePhoto();
  };

  const cameraActive = cameraState === "scanning" || cameraState === "placed";

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-6">
        {STANDALONE ? (
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white backdrop-blur-xl">
            SC Characters
          </span>
        ) : (
          <a href="/" className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white backdrop-blur-xl">
            <ArrowLeft className="size-4" /> Characters
          </a>
        )}
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 backdrop-blur-xl">
          <img src={`${import.meta.env.BASE_URL}sc-printing-logo.png`} alt="SC Printing" className="h-7 w-7 rounded-md bg-white object-contain p-0.5" />
          <span className="hidden text-xs font-semibold sm:inline">Annual Get-Together · AR</span>
        </div>
      </header>

      <section className="relative min-h-dvh overflow-hidden bg-black">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        {!cameraActive && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#172630,#050a0f_68%)]" />}

        {cameraActive && selected && (
          <div className="absolute inset-0 z-10">
            <RobotScene variant={selected} arMode onCanvasReady={handleCanvas} anchorRef={anchorRef} />
          </div>
        )}

        {cameraState === "scanning" && !selected && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="relative h-64 w-64 rounded-[2rem] border border-cyan-200/70 shadow-[0_0_0_999px_rgba(2,6,23,0.32)]">
              <span className="absolute -left-1 -top-1 h-12 w-12 rounded-tl-[2rem] border-l-4 border-t-4 border-cyan-300" />
              <span className="absolute -right-1 -top-1 h-12 w-12 rounded-tr-[2rem] border-r-4 border-t-4 border-cyan-300" />
              <span className="absolute -bottom-1 -left-1 h-12 w-12 rounded-bl-[2rem] border-b-4 border-l-4 border-cyan-300" />
              <span className="absolute -bottom-1 -right-1 h-12 w-12 rounded-br-[2rem] border-b-4 border-r-4 border-cyan-300" />
              <span className="absolute inset-x-5 top-1/2 h-0.5 animate-pulse bg-cyan-300 shadow-[0_0_18px_#22d3ee]" />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-4 pb-5 pt-24 sm:px-6 sm:pb-7">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-xl">
              <ScanLine className="size-3.5 text-cyan-300" /> {message}
            </div>

            {!cameraActive ? (
              <Button type="button" onClick={startCamera} className="h-12 rounded-full bg-cyan-300 px-6 text-slate-950 hover:bg-cyan-200">
                <Camera /> {selected ? "Place character in AR" : "Start AR QR scanner"}
              </Button>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {selected && (
                  <Button type="button" onClick={scanAnother} className="h-11 rounded-full bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200">
                    <RefreshCcw /> Scan another QR
                  </Button>
                )}
                {selected && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleLock}
                    aria-pressed={locked}
                    className={`h-11 rounded-full px-5 ${locked ? "border-cyan-300 bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/30 hover:text-white" : "border-white/20 bg-slate-950/65 text-white hover:bg-white/10 hover:text-white"}`}
                  >
                    {locked ? <Lock /> : <Unlock />}
                    {locked ? "Locked" : "Lock"}
                  </Button>
                )}
                {selected && (
                  <Button type="button" onClick={capturePhoto} className="h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">
                    <Camera /> Take photo
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={stopCamera} className="h-11 rounded-full border-white/20 bg-slate-950/65 px-5 text-white hover:bg-white/10 hover:text-white">
                  <CameraOff /> Stop camera
                </Button>
              </div>
            )}

            {cameraState === "error" && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CHARACTER_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectCharacter(id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${selected === id ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/15 bg-slate-950/55 text-slate-300"}`}
                  >
                    {CHARACTERS[id].shortName}
                  </button>
                ))}
              </div>
            )}


          </div>
        </div>
      </section>

      {photo && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur">
          <div className="flex justify-end p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhoto(null)}
              className="h-11 rounded-full border-white/20 bg-slate-950/65 px-4 text-white hover:bg-white/10 hover:text-white"
            >
              <X /> Close
            </Button>
          </div>
          <img src={photo} alt="Your AR photo" className="mx-auto max-h-[68dvh] object-contain" />
          <div className="flex flex-wrap justify-center gap-3 p-6">
            <Button type="button" onClick={sharePhoto} className="h-12 rounded-full bg-cyan-300 px-6 text-slate-950 hover:bg-cyan-200">
              <Share2 /> Share
            </Button>
            <Button type="button" variant="outline" onClick={savePhoto} className="h-12 rounded-full border-white/20 bg-slate-950/65 px-6 text-white hover:bg-white/10 hover:text-white">
              <Download /> Save
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
