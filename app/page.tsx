"use client";

import { useEffect, useState } from "react";
import { RobotScene } from "@/components/robot-scene";
import { isCharacterId, type CharacterId } from "@/components/characters/registry";

export default function Home() {
  const [selected, setSelected] = useState<CharacterId>("press");

  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("model");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCharacterId(model)) setSelected(model);
  }, []);

  return (
    <main className="model-only-shell">
      <RobotScene variant={selected} minimal />
    </main>
  );
}
