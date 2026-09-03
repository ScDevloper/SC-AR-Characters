"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Printer, QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHARACTERS, CHARACTER_IDS, hex, type CharacterId } from "@/components/characters/registry";
import { encodeQr, qrPathData, qrToSvg, type EccLevel } from "@/lib/qr";

const QUIET_ZONE = 4;

/** Mix a colour toward black so tinted codes keep enough contrast to scan. */
function darken(color: number, amount = 0.55): string {
  const r = Math.round(((color >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((color >> 8) & 0xff) * (1 - amount));
  const b = Math.round((color & 0xff) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QrSheetPage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [ecc, setEcc] = useState<EccLevel>("Q");
  const [tinted, setTinted] = useState(true);
  const [destination, setDestination] = useState<"ar" | "viewer">("ar");
  const [copied, setCopied] = useState<CharacterId | null>(null);

  // Default to wherever the app is actually being served from.
  useEffect(() => {
    // On GitHub Pages the app lives under /SC-AR-Characters/, so the origin
    // alone would generate codes pointing at the wrong path.
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    setBaseUrl(`${window.location.origin}${base}`);
  }, []);

  const cards = useMemo(() => {
    const origin = baseUrl.trim().replace(/\/+$/, "");
    return CHARACTER_IDS.map((id) => {
      const character = CHARACTERS[id];
      const root = origin || "https://example.com";
      const url = destination === "ar" ? `${root}/ar?model=${id}` : `${root}/?model=${id}`;
      const dark = tinted ? darken(character.accent) : "#0b1120";
      const modules = encodeQr(url, ecc);
      return {
        id,
        character,
        url,
        dark,
        modules,
        path: qrPathData(modules, QUIET_ZONE),
        span: modules.length + QUIET_ZONE * 2,
      };
    });
  }, [baseUrl, destination, ecc, tinted]);

  const downloadPng = (card: (typeof cards)[number], scale = 20) => {
    const size = card.span * scale;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = card.dark;
    card.modules.forEach((row, y) => {
      row.forEach((on, x) => {
        if (on) ctx.fillRect((x + QUIET_ZONE) * scale, (y + QUIET_ZONE) * scale, scale, scale);
      });
    });
    canvas.toBlob((blob) => {
      if (blob) download(`sc-qr-${card.id}.png`, blob);
    }, "image/png");
  };

  const downloadSvg = (card: (typeof cards)[number]) => {
    const svg = qrToSvg(card.url, { ecc, dark: card.dark, quietZone: QUIET_ZONE });
    download(`sc-qr-${card.id}.svg`, new Blob([svg], { type: "image/svg+xml" }));
  };

  const copyLink = async (card: (typeof cards)[number]) => {
    await navigator.clipboard.writeText(card.url);
    setCopied(card.id);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; }
          .qr-noprint { display: none !important; }
          .qr-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8mm !important; }
          .qr-card { break-inside: avoid; border: 1px dashed #cbd5e1 !important; background: #fff !important; color: #0f172a !important; box-shadow: none !important; }
          .qr-card p, .qr-card h2, .qr-card span { color: #0f172a !important; }
        }
      `}</style>

      <header className="qr-noprint mx-auto mb-8 flex max-w-6xl flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src="/sc-printing-logo.png" alt="SC Printing" className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg" />
            <div>
              <p className="text-sm font-semibold text-white">Annual Get-Together</p>
              <p className="text-xs text-slate-400">SC Printing · AR Character Collection</p>
            </div>
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300">TABLE QR SHEET</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {cards.length} codes, generated automatically
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            One QR per character, built in the browser from the character registry. Add a character
            to the registry and its code shows up here on the next load.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 rounded-full bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200"
        >
          <Printer /> Print sheet
        </Button>
      </header>

      <section className="qr-noprint mx-auto mb-8 grid max-w-6xl gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="text-sm">
          <span className="mb-1.5 block text-slate-300">Base URL</span>
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://your-site.example.com"
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-slate-300">QR destination</span>
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value as "ar" | "viewer")}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
          >
            <option value="ar">AR camera view</option>
            <option value="viewer">3D viewer</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-slate-300">Error correction</span>
          <select
            value={ecc}
            onChange={(event) => setEcc(event.target.value as EccLevel)}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
          >
            <option value="L">L — smallest</option>
            <option value="M">M — standard</option>
            <option value="Q">Q — recommended for print</option>
            <option value="H">H — survives smudges</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-slate-300">Colour</span>
          <select
            value={tinted ? "tint" : "black"}
            onChange={(event) => setTinted(event.target.value === "tint")}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
          >
            <option value="tint">Character colour</option>
            <option value="black">Black</option>
          </select>
        </label>
      </section>

      <div className="qr-grid mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="qr-card rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
          >
            <div className="mx-auto w-full max-w-[220px] rounded-xl bg-white p-3">
              <svg
                viewBox={`0 0 ${card.span} ${card.span}`}
                shapeRendering="crispEdges"
                className="h-auto w-full"
                role="img"
                aria-label={`QR code for ${card.character.name}`}
              >
                <rect width={card.span} height={card.span} fill="#ffffff" />
                <path d={card.path} fill={card.dark} />
              </svg>
            </div>

            <h2 className="mt-4 text-lg font-semibold">{card.character.name}</h2>
            <p className="text-xs text-slate-400">
              {card.character.code} · {card.character.role}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300">
              <ScanLine className="size-3" /> {destination === "ar" ? "Scan to view in AR" : "Scan to open 3D"}
            </p>
            <span
              className="mt-2 inline-block h-1 w-10 rounded-full"
              style={{ background: hex(card.character.accent) }}
            />

            <div className="qr-noprint mt-4 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadPng(card)}
                className="rounded-full"
              >
                <Download /> PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadSvg(card)}
                className="rounded-full"
              >
                <QrCode /> SVG
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyLink(card)}
                className="rounded-full"
              >
                {copied === card.id ? <Check /> : <Copy />}
                {copied === card.id ? "Copied" : "Link"}
              </Button>
            </div>

            <p className="qr-noprint mt-3 truncate text-[11px] text-slate-500" title={card.url}>
              {card.url}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
