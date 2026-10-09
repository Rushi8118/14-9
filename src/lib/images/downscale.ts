/**
 * Shrinks an image in the browser before it is uploaded.
 *
 * WHY THIS EXISTS
 *
 * Measured against production on 2026-10-09: the 14 active urgent requirements
 * carried **27.7 MB** of cover images, mean **2,028 kB each**, all PNG exports
 * straight from an image generator. /urgent-requirements pulled 6.9 MB of them
 * on one mobile page view. That is the single largest cost on the page — far
 * larger than any JavaScript on it.
 *
 * Supabase Storage can resize on the fly, which would have fixed this without
 * touching uploads, but the project's plan does not include it: the render
 * endpoint answers `403 FeatureNotEnabled`. So the resize has to happen before
 * the bytes are stored, which means here.
 *
 * WHY IT NEVER BLOCKS AN UPLOAD
 *
 * Every failure path returns the original file. A browser without
 * `createImageBitmap`, a CMYK JPEG the decoder refuses, a canvas that comes back
 * blank under memory pressure, a WebP encoder that is not there — none of those
 * should stop an admin publishing a vacancy. A 2 MB image is a performance
 * problem; a failed publish is an outage.
 *
 * The result is also discarded if it is not actually smaller, so an
 * already-optimised 40 kB WebP is never re-encoded into something worse.
 */

export type DownscaleOptions = {
  /**
   * Longest edge of the output, in pixels.
   *
   * 1600 covers the largest place these images are shown — the detail-page hero
   * — at 2x device pixel ratio, and the listing cards render at about 360 CSS
   * px, so they are oversupplied either way. Going lower would visibly soften
   * the hero on a retina laptop.
   */
  maxEdge?: number
  /** WebP quality. 0.82 is past the point where artefacts show on photos. */
  quality?: number
  /** Skip files already below this size; re-encoding them wins nothing. */
  skipBelowBytes?: number
}

const DEFAULTS: Required<DownscaleOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  skipBelowBytes: 150 * 1024,
}

/** Animation would be flattened to a single frame, and SVG must not be rasterised. */
const PASS_THROUGH = /^image\/(gif|svg\+xml|avif)$/i

const renameTo = (name: string, ext: string) => `${name.replace(/\.[^.]+$/, '')}.${ext}`

async function encode(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    try {
      return await canvas.convertToBlob({ type, quality })
    } catch {
      return null
    }
  }
  return new Promise((resolve) => {
    try {
      ;(canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), type, quality)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Returns a smaller version of `file`, or `file` itself when shrinking is
 * impossible, unnecessary or would not help.
 */
export async function downscaleImage(file: File, options: DownscaleOptions = {}): Promise<File> {
  const { maxEdge, quality, skipBelowBytes } = { ...DEFAULTS, ...options }

  if (typeof createImageBitmap !== 'function') return file
  if (PASS_THROUGH.test(file.type)) return file
  if (file.size <= skipBelowBytes) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = longest > maxEdge ? maxEdge / longest : 1
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas: OffscreenCanvas | HTMLCanvasElement =
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), { width, height })

    const context = canvas.getContext('2d') as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null
    if (!context) return file

    // A transparent PNG flattened onto nothing turns black in WebP's lossy mode,
    // so give it a white backdrop first — these are photographic posters, not
    // UI assets that need their alpha.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)

    let blob = await encode(canvas, 'image/webp', quality)
    let ext = 'webp'
    if (!blob || blob.type !== 'image/webp') {
      blob = await encode(canvas, 'image/jpeg', quality)
      ext = 'jpg'
    }
    if (!blob || blob.size === 0) return file

    // Re-encoding is only worth it if it actually paid.
    if (blob.size >= file.size) return file

    return new File([blob], renameTo(file.name, ext), {
      type: blob.type,
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    bitmap.close?.()
  }
}

/** "2.1 MB → 48 kB (98% smaller)", for the toast after an upload. */
export function describeSaving(before: number, after: number): string | null {
  if (after >= before) return null
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`)
  return `${kb(before)} → ${kb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`
}
