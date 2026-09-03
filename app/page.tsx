"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Boxes, Palette, QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RobotScene } from "@/components/robot-scene";
import {
  CHARACTERS,
  CHARACTER_IDS,
  hex,
  isCharacterId,
  type CharacterId,
} from "@/components/characters/registry";

export default function Home() {
  const [selected, setSelected] = useState<CharacterId>("press");

  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("model");
    if (isCharacterId(model)) setSelected(model);
  }, []);

  const selectCharacter = (model: CharacterId) => {
    setSelected(model);
    const url = new URL(window.location.href);
    url.searchParams.set("model", model);
    window.history.replaceState({}, "", url);
  };

  const active = CHARACTERS[selected];

  return (
    <main className="app-shell">
      <header className="site-header">
        <a href="/" className="brand-lockup" aria-label="SC Printing character home">
          <span className="brand-mark">
            <img src="/sc-printing-logo.png" alt="SC Printing" />
          </span>
          <span>
            <strong>Annual Get-Together</strong>
            <small>SC Printing · 3D Character Collection</small>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/ar"
            className="header-action"
          >
            <ScanLine className="size-3.5" /> AR scan
          </a>
          <a
            href="/qr"
            className="header-action"
          >
            <QrCode className="size-3.5" /> QR sheet
          </a>
          <div className="model-status">
            <span /> {CHARACTER_IDS.length} models online
          </div>
        </div>
      </header>

      <div className="collection-layout">
        <section className="character-rail" aria-label="Choose a character">
          <div className="rail-heading">
            <p className="eyebrow">SC PRINTING · ANNUAL GET-TOGETHER</p>
            <h1>
              {CHARACTER_IDS.length} machines.
              <br />
              {CHARACTER_IDS.length} personalities.
            </h1>
            <p className="intro-copy">
              Each QR can open one dedicated printing or packaging character.
            </p>
          </div>

          <div className="character-list">
            {CHARACTER_IDS.map((key, index) => {
              const character = CHARACTERS[key];
              const isActive = selected === key;
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  onClick={() => selectCharacter(key)}
                  aria-pressed={isActive}
                  className={`character-card ${isActive ? "is-active" : ""}`}
                  style={{ "--character-color": hex(character.accent) } as CSSProperties}
                >
                  <span className="character-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
              <span className="active-dot" style={{ background: hex(active.accent) }} />
              <span>{active.code}</span>
            </div>
            <p>{active.role}</p>
          </div>

          <div id="viewer" className="viewer-wrap">
            <RobotScene variant={selected} />
          </div>

          <div className="mobile-character-strip" aria-label="Choose another character">
            {CHARACTER_IDS.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                onClick={() => selectCharacter(key)}
                aria-pressed={selected === key}
                className={selected === key ? "is-active" : ""}
              >
                {CHARACTERS[key].shortName}
              </Button>
            ))}
          </div>
        </section>
      </div>

      <footer className="collection-footer">
        <span>
          <Boxes /> Browser-native geometry
        </span>
        <span>
          <Palette /> {CHARACTER_IDS.length} unique characters
        </span>
        <span>
          <QrCode /> Direct QR-ready URLs
        </span>
      </footer>
    </main>
  );
}
