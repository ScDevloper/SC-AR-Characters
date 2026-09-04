import * as THREE from "three";
import {
  buildArm,
  buildDrone,
  buildQuad,
  buildRoll,
  buildRover,
  buildStack,
} from "@/components/characters/bodies";
import { buildDancer } from "@/components/characters/bodies-people";
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
import { buildGantry, buildKiosk, buildOrb, buildPress } from "@/components/characters/bodies-machines";
import { buildCrawler, buildDrop, buildSwarm, buildTube } from "@/components/characters/bodies-organic";
import { buildHumanoid } from "@/components/characters/humanoid";
import { createPalette, type CharacterRig } from "@/components/characters/kit";
import { CHARACTERS, type CharacterId } from "@/components/characters/registry";

/** Builds the selected procedural character for either the viewer or marker AR. */
export function createCharacter(scene: THREE.Scene, id: CharacterId): CharacterRig {
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
    case "dancer":
      return buildDancer(scene, palette);
    case "humanoid":
    default:
      return buildHumanoid(scene, palette, id);
  }
}
