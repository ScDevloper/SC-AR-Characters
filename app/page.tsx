"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Boxes, Palette, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ROBOT_VARIANTS,
  RobotScene,
  type RobotVariant,
} from "@/components/robot-scene";

const characterOrder = Object.keys(ROBOT_VARIANTS) as RobotVariant[];

function isRobotVariant(value: string | null): value is RobotVariant {
  return Boolean(value && value in ROBOT_VARIANTS);
}

export default function Home() {
  const [selected, setSelected] = useState<RobotVariant>("press");

  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("model");
    if (isRobotVariant(model)) setSelected(model);
  }, []);

  const selectCharacter = (model: RobotVariant) => {
    setSelected(model);
    const url = new URL(window.location.href);
    url.searchParams.set("model", model);
    window.history.replaceState({}, "", url);
  };

  const active = ROBOT_VARIANTS[selected];

  return (
    <main className="app-shell">
      <header className="site-header">
        <a href="/" className="brand-lockup" aria-label="SC Printing Robot home">
          <span className="brand-mark">
            <img src="/sc-printing-logo.png" alt="SC Printing" />
          </span>
          <span>
            <strong>Annual Get-Together</strong>
            <small>SC Printing · 3D Character Collection</small>
          </span>
        </a>
        <div className="model-status">
          <span /> Twelve models online
        </div>
      </header>

      <div className="collection-layout">
        <section className="character-rail" aria-label="Choose a character">
          <div className="rail-heading">
            <p className="eyebrow">SC PRINTING · ANNUAL GET-TOGETHER</p>
            <h1>Twelve machines.<br />Twelve personalities.</h1>
            <p className="intro-copy">
              Each QR can open one dedicated printing or packaging character.
            </p>
          </div>

          <div className="character-list">
            {characterOrder.map((key, index) => {
              const character = ROBOT_VARIANTS[key];
              const isActive = selected === key;
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  onClick={() => selectCharacter(key)}
                  aria-pressed={isActive}
                  className={`character-card ${isActive ? "is-active" : ""}`}
                  style={{ "--character-color": `#${character.accent.toString(16).padStart(6, "0")}` } as CSSProperties}
                >
                  <span className="character-number">0{index + 1}</span>
                  <span className="character-meta">
                    <strong>{character.name}</strong>
                    <small>{character.role}</small>
                  </span>
                  <QrCode className="character-qr" />
                </Button>
              );
            })}
          </div>
        </section>

        <section className="viewer-column">
          <div className="active-summary">
            <div>
              <span className="active-dot" style={{ background: `#${active.accent.toString(16).padStart(6, "0")}` }} />
              <span>{active.code}</span>
            </div>
            <p>{active.role}</p>
          </div>

          <div id="viewer" className="viewer-wrap">
            <RobotScene variant={selected} />
          </div>

          <div className="mobile-character-strip" aria-label="Choose another character">
            {characterOrder.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                onClick={() => selectCharacter(key)}
                aria-pressed={selected === key}
                className={selected === key ? "is-active" : ""}
              >
                {ROBOT_VARIANTS[key].shortName}
              </Button>
            ))}
          </div>
        </section>
      </div>

      <footer className="collection-footer">
        <span><Boxes /> Browser-native geometry</span>
        <span><Palette /> Twelve unique characters</span>
        <span><QrCode /> Direct QR-ready URLs</span>
      </footer>
    </main>
  );
}
