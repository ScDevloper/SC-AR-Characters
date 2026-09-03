"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { ArrowLeft, Camera, CameraOff, QrCode, RefreshCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RobotScene } from "@/components/robot-scene";
import {
  CHARACTERS,
  CHARACTER_IDS,
  isCharacterId,
  type CharacterId,
} from "@/components/characters/registry";

type CameraState = "ready" | "starting" | "scanning" | "placed" | "error";

function characterFromQr(value: string): CharacterId | null {
  const raw = value.trim();
  if (isCharacterId(raw)) return raw;

  try {
    const url = new URL(raw, window.location.origin);
    const model = url.searchParams.get("model");
    return isCharacterId(model) ? model : null;
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

  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("model");
    if (isCharacterId(model)) {
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
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 300,
        delayBetweenScanSuccess: 900,
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
          if (!result || handledRef.current) return;
          const id = characterFromQr(result.getText());
          if (!id) {
            setMessage("That QR is not an SC character code. Try another one.");
            return;
          }
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
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("ready");
    setMessage(selected ? `${CHARACTERS[selected].name} is ready for AR.` : "Camera stopped.");
  };

  const cameraActive = cameraState === "scanning" || cameraState === "placed";

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-6">
        <a href="/" className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white backdrop-blur-xl">
          <ArrowLeft className="size-4" /> Characters
        </a>
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
            <RobotScene variant={selected} arMode />
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
                <Button type="button" variant="outline" onClick={stopCamera} className="h-11 rounded-full border-white/20 bg-slate-950/65 px-5 text-white hover:bg-white/10 hover:text-white">
                  <CameraOff /> Stop camera
                </Button>
              </div>
            )}

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

            <a href="/qr" className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-200">
              <QrCode className="size-3.5" /> Open printable QR sheet
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
