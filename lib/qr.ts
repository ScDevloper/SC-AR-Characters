/**
 * Dependency-free QR Code encoder (byte mode, versions 1-40, ECC L/M/Q/H).
 *
 * Runs in the browser and on the Worker - no npm package, so `package-lock.json`
 * stays untouched. Returns a boolean matrix (`true` = dark module) plus helpers
 * for turning that matrix into SVG markup.
 */

export type EccLevel = "L" | "M" | "Q" | "H";

const ECC_CODEWORDS_PER_BLOCK: Record<EccLevel, number[]> = {
  // Index 0 is unused so that ECC_CODEWORDS_PER_BLOCK[ecc][version] reads naturally.
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

const NUM_ERROR_CORRECTION_BLOCKS: Record<EccLevel, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

const FORMAT_BITS: Record<EccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

/* ------------------------------------------------------------------ *
 * GF(256) arithmetic for Reed-Solomon
 * ------------------------------------------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: Uint8Array, degree: number): Uint8Array {
  const generator = rsGeneratorPoly(degree);
  const result = new Uint8Array(degree);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[degree - 1] = 0;
    for (let i = 0; i < degree; i++) result[i] ^= gfMul(generator[i + 1], factor);
  }
  return result;
}

/* ------------------------------------------------------------------ *
 * Version / capacity helpers
 * ------------------------------------------------------------------ */

function numRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(version: number, ecc: EccLevel): number {
  return (
    Math.floor(numRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ecc][version] * NUM_ERROR_CORRECTION_BLOCKS[ecc][version]
  );
}

function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const size = version * 4 + 17;
  const result: number[] = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

/* ------------------------------------------------------------------ *
 * Bit buffer
 * ------------------------------------------------------------------ */

class BitBuffer {
  readonly bits: number[] = [];

  append(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }

  get length() {
    return this.bits.length;
  }
}

/* ------------------------------------------------------------------ *
 * Encoder
 * ------------------------------------------------------------------ */

function toDataCodewords(bytes: Uint8Array, version: number, ecc: EccLevel): Uint8Array {
  const capacityBits = numDataCodewords(version, ecc) * 8;
  const buffer = new BitBuffer();
  buffer.append(0b0100, 4); // byte mode
  buffer.append(bytes.length, version <= 9 ? 8 : 16);
  for (const byte of bytes) buffer.append(byte, 8);

  buffer.append(0, Math.min(4, capacityBits - buffer.length)); // terminator
  buffer.append(0, (8 - (buffer.length % 8)) % 8); // pad to a byte boundary

  for (let pad = 0xec; buffer.length < capacityBits; pad ^= 0xec ^ 0x11) {
    buffer.append(pad, 8);
  }

  const codewords = new Uint8Array(buffer.length / 8);
  buffer.bits.forEach((bit, index) => {
    codewords[index >>> 3] |= bit << (7 - (index & 7));
  });
  return codewords;
}

function interleave(data: Uint8Array, version: number, ecc: EccLevel): Uint8Array {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecc][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecc][version];
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks: Uint8Array[] = [];
  const eccBlocks: Uint8Array[] = [];
  for (let i = 0, offset = 0; i < numBlocks; i++) {
    const dataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + dataLen);
    offset += dataLen;
    blocks.push(block);
    eccBlocks.push(rsRemainder(block, blockEccLen));
  }

  const result = new Uint8Array(rawCodewords);
  let index = 0;
  const maxDataLen = shortBlockLen - blockEccLen + 1;
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < blocks[b].length) result[index++] = blocks[b][i];
    }
  }
  for (let i = 0; i < blockEccLen; i++) {
    for (let b = 0; b < numBlocks; b++) result[index++] = eccBlocks[b][i];
  }
  return result;
}

type Matrix = { modules: boolean[][]; reserved: boolean[][]; size: number };

function blankMatrix(size: number): Matrix {
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  return { modules, reserved, size };
}

function setFunction(matrix: Matrix, x: number, y: number, dark: boolean) {
  if (x < 0 || y < 0 || x >= matrix.size || y >= matrix.size) return;
  matrix.modules[y][x] = dark;
  matrix.reserved[y][x] = true;
}

function drawFinder(matrix: Matrix, cx: number, cy: number) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFunction(matrix, cx + dx, cy + dy, dist !== 2 && dist !== 4);
    }
  }
}

function drawFunctionPatterns(matrix: Matrix, version: number) {
  const size = matrix.size;

  for (let i = 0; i < size; i++) {
    setFunction(matrix, 6, i, i % 2 === 0);
    setFunction(matrix, i, 6, i % 2 === 0);
  }

  drawFinder(matrix, 3, 3);
  drawFinder(matrix, size - 4, 3);
  drawFinder(matrix, 3, size - 4);

  const positions = alignmentPatternPositions(version);
  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions.length; j++) {
      const skipCorner =
        (i === 0 && j === 0) ||
        (i === 0 && j === positions.length - 1) ||
        (i === positions.length - 1 && j === 0);
      if (skipCorner) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunction(
            matrix,
            positions[j] + dx,
            positions[i] + dy,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          );
        }
      }
    }
  }

  // Reserve the format-information strips; real values are written after masking.
  // Index 6 is skipped: those cells belong to the timing patterns drawn above.
  for (let i = 0; i <= 8; i++) {
    if (i === 6) continue;
    setFunction(matrix, i, 8, false);
    setFunction(matrix, 8, i, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunction(matrix, size - 1 - i, 8, false);
    setFunction(matrix, 8, size - 1 - i, false);
  }
  setFunction(matrix, 8, size - 8, true); // permanent dark module

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(matrix, a, b, dark);
      setFunction(matrix, b, a, dark);
    }
  }
}

function drawFormatBits(matrix: Matrix, ecc: EccLevel, mask: number) {
  const data = (FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const size = matrix.size;

  for (let i = 0; i <= 5; i++) setFunction(matrix, 8, i, ((bits >>> i) & 1) !== 0);
  setFunction(matrix, 8, 7, ((bits >>> 6) & 1) !== 0);
  setFunction(matrix, 8, 8, ((bits >>> 7) & 1) !== 0);
  setFunction(matrix, 7, 8, ((bits >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i++) setFunction(matrix, 14 - i, 8, ((bits >>> i) & 1) !== 0);

  for (let i = 0; i < 8; i++) {
    setFunction(matrix, size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
  }
  for (let i = 8; i < 15; i++) {
    setFunction(matrix, 8, size - 15 + i, ((bits >>> i) & 1) !== 0);
  }
  setFunction(matrix, 8, size - 8, true);
}

function drawCodewords(matrix: Matrix, codewords: Uint8Array) {
  const size = matrix.size;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // the vertical timing column is skipped
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (matrix.reserved[y][x]) continue;
        if (index < codewords.length * 8) {
          matrix.modules[y][x] = ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0;
          index++;
        }
      }
    }
  }
}

function maskCondition(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(matrix: Matrix, mask: number) {
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.reserved[y][x] && maskCondition(mask, x, y)) {
        matrix.modules[y][x] = !matrix.modules[y][x];
      }
    }
  }
}

/** Counts 1:1:3:1:1 finder-like patterns in a run-length history window. */
function finderPatternCount(history: number[]): number {
  const n = history[1];
  const core =
    n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
  return (
    (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) +
    (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0)
  );
}

function addRunHistory(runLength: number, history: number[], size: number) {
  if (history[0] === 0) runLength += size; // treat the border as a light run
  history.pop();
  history.unshift(runLength);
}

function penaltyScore(matrix: Matrix): number {
  const size = matrix.size;
  const m = matrix.modules;
  let score = 0;

  // Rule 1 + rule 3: same-colour runs and finder-like patterns, both axes.
  for (const isRow of [true, false]) {
    for (let a = 0; a < size; a++) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let b = 0; b < size; b++) {
        const color = isRow ? m[a][b] : m[b][a];
        if (color === runColor) {
          runLength++;
          if (runLength === 5) score += 3;
          else if (runLength > 5) score += 1;
        } else {
          addRunHistory(runLength, history, size);
          if (!runColor) score += finderPatternCount(history) * 40;
          runColor = color;
          runLength = 1;
        }
      }
      // Terminate the final run and add the trailing light border.
      if (runColor) {
        addRunHistory(runLength, history, size);
        runLength = 0;
      }
      runLength += size;
      addRunHistory(runLength, history, size);
      score += finderPatternCount(history) * 40;
    }
  }

  // Rule 2: 2x2 blocks of one colour.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  }

  // Rule 4: dark-module balance.
  let dark = 0;
  for (const row of m) for (const cell of row) if (cell) dark++;
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  score += Math.max(k, 0) * 10;

  return score;
}

/**
 * Encode `text` and return the module matrix, indexed `[row][column]`.
 * `true` means a dark module. The quiet zone is not included.
 */
export function encodeQr(text: string, ecc: EccLevel = "M", minVersion = 1): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  let version = minVersion;
  for (; version <= 40; version++) {
    const capacity = numDataCodewords(version, ecc) * 8;
    const headerBits = 4 + (version <= 9 ? 8 : 16);
    if (headerBits + bytes.length * 8 <= capacity) break;
  }
  if (version > 40) throw new Error("Text is too long for a single QR code");

  const codewords = interleave(toDataCodewords(bytes, version, ecc), version, ecc);
  const size = version * 4 + 17;

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const matrix = blankMatrix(size);
    drawFunctionPatterns(matrix, version);
    drawCodewords(matrix, codewords);
    drawFormatBits(matrix, ecc, mask);
    applyMask(matrix, mask);
    const score = penaltyScore(matrix);
    if (score < bestScore) {
      bestScore = score;
      best = matrix.modules;
    }
  }
  return best!;
}

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */

/** SVG path data for every dark module, one `M..h..v..h..z` per module. */
export function qrPathData(modules: boolean[][], quietZone = 4): string {
  const parts: string[] = [];
  for (let y = 0; y < modules.length; y++) {
    for (let x = 0; x < modules.length; x++) {
      if (modules[y][x]) {
        parts.push(`M${x + quietZone} ${y + quietZone}h1v1h-1z`);
      }
    }
  }
  return parts.join("");
}

export type QrSvgOptions = {
  ecc?: EccLevel;
  quietZone?: number;
  dark?: string;
  light?: string;
  /** Fraction (0-0.3) of the code covered by a centred logo hole. */
  logoHole?: number;
};

/** Standalone SVG markup - use for downloads or `dangerouslySetInnerHTML`. */
export function qrToSvg(text: string, options: QrSvgOptions = {}): string {
  const {
    ecc = "M",
    quietZone = 4,
    dark = "#000000",
    light = "#ffffff",
    logoHole = 0,
  } = options;

  const modules = encodeQr(text, ecc);
  const size = modules.length + quietZone * 2;
  const hole =
    logoHole > 0
      ? (() => {
          const holeSize = Math.round(modules.length * Math.min(logoHole, 0.3));
          const start = quietZone + Math.floor((modules.length - holeSize) / 2);
          return `<rect x="${start}" y="${start}" width="${holeSize}" height="${holeSize}" rx="${holeSize * 0.18}" fill="${light}"/>`;
        })()
      : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="${light}"/>`,
    `<path d="${qrPathData(modules, quietZone)}" fill="${dark}"/>`,
    hole,
    `</svg>`,
  ].join("");
}
