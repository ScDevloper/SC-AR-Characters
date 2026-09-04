/**
 * Turns ZXing's finder-pattern points into a screen-space anchor the 3D scene
 * can follow.
 *
 * A QR result carries three finder-pattern centres (bottom-left, top-left,
 * top-right). That is enough for position, apparent size and roll - but NOT
 * for full 6DoF pose. The character will stick to the code's position on
 * screen and grow as you walk towards it; it will not tilt with the table's
 * perspective. Doing that properly needs a PnP solve against four known
 * corners, which is a different piece of work.
 */

export type MarkerAnchor = {
  /** Position in the displayed canvas, normalised 0-1. */
  x: number;
  y: number;
  /** Marker span as a fraction of the displayed width. Bigger = closer. */
  scale: number;
  /** Roll of the code in the image plane, radians. */
  roll: number;
  /** performance.now() when this reading was taken. */
  at: number;
};

type Point = { getX(): number; getY(): number };

/**
 * ZXing reports points in *video* pixels, but the video is drawn with
 * `object-fit: cover`, so part of the frame is cropped off. Without undoing
 * that crop the character sits noticeably off the code on any phone whose
 * camera aspect differs from the screen.
 */
export function anchorFromPoints(
  points: Point[],
  video: HTMLVideoElement,
  boxWidth: number,
  boxHeight: number,
): MarkerAnchor | null {
  if (points.length < 3 || !video.videoWidth || !boxWidth || !boxHeight) return null;

  const cover = Math.max(boxWidth / video.videoWidth, boxHeight / video.videoHeight);
  const drawWidth = video.videoWidth * cover;
  const drawHeight = video.videoHeight * cover;
  const offsetX = (boxWidth - drawWidth) / 2;
  const offsetY = (boxHeight - drawHeight) / 2;

  const mapped = points.map((point) => ({
    x: (point.getX() * cover + offsetX) / boxWidth,
    y: (point.getY() * cover + offsetY) / boxHeight,
  }));

  const centre = mapped.reduce(
    (acc, p) => ({ x: acc.x + p.x / mapped.length, y: acc.y + p.y / mapped.length }),
    { x: 0, y: 0 },
  );

  // Widest separation between finder patterns approximates the code's size.
  let span = 0;
  for (let i = 0; i < mapped.length; i++) {
    for (let j = i + 1; j < mapped.length; j++) {
      span = Math.max(span, Math.hypot(mapped[i].x - mapped[j].x, mapped[i].y - mapped[j].y));
    }
  }

  // ZXing orders QR points bottom-left, top-left, top-right, so the first and
  // last give the code's baseline direction.
  const roll = Math.atan2(
    mapped[mapped.length - 1].y - mapped[0].y,
    mapped[mapped.length - 1].x - mapped[0].x,
  );

  return { x: centre.x, y: centre.y, scale: Math.max(span, 0.001), roll, at: performance.now() };
}

/** How long a stale reading keeps driving the character before it is dropped. */
export const ANCHOR_GRACE_MS = 1500;

/**
 * Distance-from-apparent-size constant. Raise it to push characters further
 * away (smaller); lower it to bring them closer. Needs tuning against a real
 * printed code at the size you actually print - there is no way to derive it
 * without knowing the physical dimensions of the marker.
 */
export const ANCHOR_DISTANCE_K = 2.2;

/**
 * Every character is scaled so its LARGEST dimension is this many world units
 * before the anchor distance is applied. Without it a 5.7-unit gripper and a
 * 2.9-unit rover appear at completely different sizes on the same marker.
 *
 * Largest dimension rather than height: the crawler is 1.1 tall but 6 long, so
 * normalising on height alone would scale it up until it spanned the table.
 */
export const AR_TARGET_SIZE = 2.6;

/**
 * Hard ceiling on how much of the viewport height a character may fill, no
 * matter how close the phone gets to the code. Stops the model swallowing the
 * screen when someone leans over the table.
 */
export const AR_MAX_SCREEN_FRACTION = 0.62;
