// Sizing maths for normalising supporter logos onto a uniform plate.
//
// Contain-fitting alone gives uniform boxes but non-uniform-looking logos: a
// square mark fills the height and dominates a row, while a wide wordmark
// floats in the middle looking timid. So each orientation gets its own cap,
// chosen so the logos read as equal weight rather than equal bounding box.

export const WIDE_WIDTH_RATIO = 0.92   // aspect > 2:1  — wordmarks
export const SQUARE_HEIGHT_RATIO = 0.72 // 0.7–2:1      — square-ish marks
export const TALL_HEIGHT_RATIO = 0.65   // aspect < 0.7:1 — tall marks

/**
 * Where to draw a logo inside its plate.
 *
 * Never upscales past the source: a small logo stays small rather than being
 * blown up into a blurry one. Result is centred in the tile.
 *
 * @param {{srcW: number, srcH: number, tileW: number, tileH: number}} args
 * @returns {{x: number, y: number, width: number, height: number}} draw rect
 */
export function fitBox({ srcW, srcH, tileW, tileH }) {
  if (!srcW || !srcH || !tileW || !tileH) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const aspect = srcW / srcH

  let width
  let height
  if (aspect > 2) {
    width = tileW * WIDE_WIDTH_RATIO
    height = width / aspect
  } else if (aspect >= 0.7) {
    height = tileH * SQUARE_HEIGHT_RATIO
    width = height * aspect
  } else {
    height = tileH * TALL_HEIGHT_RATIO
    width = height * aspect
  }

  // A wide logo can still overflow the tile width after the height-led branches,
  // and a tall one can overflow the height. Clamp both ways, preserving aspect.
  if (width > tileW * WIDE_WIDTH_RATIO) {
    width = tileW * WIDE_WIDTH_RATIO
    height = width / aspect
  }
  if (height > tileH * SQUARE_HEIGHT_RATIO) {
    height = tileH * SQUARE_HEIGHT_RATIO
    width = height * aspect
  }

  // Never upscale.
  if (width > srcW || height > srcH) {
    const scale = Math.min(srcW / width, srcH / height)
    width *= scale
    height *= scale
  }

  return {
    x: Math.round((tileW - width) / 2),
    y: Math.round((tileH - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  }
}

/** The supporter tile, in CSS px. Canvas draws at 2x this. */
export const SUPPORTER_TILE = { width: 260, height: 160 }
