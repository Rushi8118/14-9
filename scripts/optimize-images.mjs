/**
 * Regenerates the AVIF/WebP derivatives in public/ from their source JPEG/PNG files.
 * Run after replacing any source image: `npm run images`.
 *
 * The hero poster is the homepage LCP element, so it gets its own small derivative
 * rather than reusing the full-resolution globe texture.
 */
import sharp from 'sharp'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const at = (file) => path.join(publicDir, file)
const sizeKb = async (file) => Math.round((await stat(at(file))).size / 1024)

/** Rendered at 256px CSS and scaled 1.5x, so 768px covers a 2x display. */
const POSTER_SOURCE = 'earth-blue-marble.jpg'
const POSTER_SIZE = 768

/** [source, output, resize width, quality] — widths chosen for a globe drawn ~500px wide. */
const TEXTURES = [
  ['earth-blue-marble.jpg', 'earth-blue-marble.webp', 1024, 82],
  ['earth-normal.jpg', 'earth-normal.webp', 1024, 72],
  ['earth-specular.jpg', 'earth-specular.webp', 512, 70],
  ['earth-clouds.png', 'earth-clouds.webp', 1024, 60],
  ['stars-bg.jpg', 'stars-bg.webp', 1600, 74],
  ['earth-texture.jpg', 'earth-texture.webp', 1024, 80],
  ['consultant-office.jpg', 'consultant-office.webp', 1200, 82],
]

async function buildPoster() {
  const base = () => sharp(at(POSTER_SOURCE)).resize(POSTER_SIZE, POSTER_SIZE, { fit: 'cover' })
  await base().avif({ quality: 62 }).toFile(at('earth-poster-768.avif'))
  await base().webp({ quality: 76 }).toFile(at('earth-poster-768.webp'))
  await base().jpeg({ quality: 80, mozjpeg: true }).toFile(at('earth-poster-768.jpg'))

  console.log(`poster: ${POSTER_SOURCE} ${await sizeKb(POSTER_SOURCE)}KB ->`)
  for (const f of ['earth-poster-768.avif', 'earth-poster-768.webp', 'earth-poster-768.jpg']) {
    console.log(`  ${f} ${await sizeKb(f)}KB`)
  }
}

/**
 * Responsive variants for the `<img>` elements on public pages.
 *
 * WHY THESE EXIST
 *
 * A responsive-image audit failed the homepage: every image was served at one
 * size regardless of how big it was actually drawn. The two offenders were
 * concrete, not theoretical:
 *
 *   consultant-office  a 1024x1024 source drawn 588px wide on desktop and
 *                      ~343px on a phone — and the markup declared
 *                      width={800} height={533}, which is not even the right
 *                      aspect ratio for a square image.
 *   the brand logo     android-chrome-192x192.png (18KB) drawn at 24x24 in the
 *                      header and 32x32 in the footer. 192px for a 24px box is
 *                      8x linear, 64x the pixels.
 *
 * WIDTHS ARE CHOSEN FROM THE MEASURED LAYOUT, NOT A GENERIC LADDER
 *
 * why-us.tsx draws the photo inside `max-w-7xl` (1280) less 48px of padding,
 * in a 12-column grid with a 56px gap, spanning 6 — so 588px on desktop and
 * 100vw below the `lg` breakpoint. 400 covers a phone at 1x, 800 covers a phone
 * at 2x and desktop at ~1.4x, and 1024 (the source's own width) covers desktop
 * at close to 2x. Generating a 1600px variant would mean upscaling, which adds
 * bytes and no detail.
 *
 * The logo is drawn at 24px and 32px, so 48 and 96 cover both at 2x and the
 * 32px case at 3x. The `sizes` attribute in the markup is what tells the
 * browser which to take.
 */
const RESPONSIVE = [
  {
    source: 'consultant-office.jpg',
    widths: [400, 800, 1024],
    // The source is square but why-us.tsx draws it in a 3:2 box and lets
    // `object-cover` crop the top and bottom away. Cropping to 3:2 here instead
    // ships only the pixels that are actually displayed, and lets the markup
    // declare intrinsic dimensions that match the file rather than describing a
    // 3:2 box around a square image. sharp's `cover` centres the crop, which is
    // exactly what `object-cover` was already doing, so the framing is unchanged.
    aspect: 3 / 2,
    formats: [
      { ext: 'webp', quality: 80 },
      { ext: 'jpg', quality: 78 },
    ],
  },
]

/**
 * The social preview card.
 *
 * Facebook, WhatsApp, LinkedIn and X all lay a shared link out at 1.91:1, and
 * SeoHead declares `twitter:card: summary_large_image`, so a square image is
 * letterboxed or centre-cropped by each platform differently. `consultant-office.jpg`
 * is 1024x1024 and was being served as the default og:image with
 * `og:image:width/height` of 1024 — truthful, but the wrong shape for every
 * consumer of it.
 *
 * NOTE ON RESOLUTION: the only source available is the 1024px square, so a 1.91:1
 * crop of it holds 1024x536 real pixels and this output is enlarged ~1.17x to reach
 * the 1200x630 Facebook recommends. That is why `withoutEnlargement` is absent here
 * and present everywhere else in this file. Replacing the source with a wider
 * original and re-running `npm run images` removes the upscale with no other change.
 */
const SOCIAL = {
  source: 'consultant-office.jpg',
  output: 'og-default.jpg',
  width: 1200,
  height: 630,
}

async function buildSocial() {
  await sharp(at(SOCIAL.source))
    .resize(SOCIAL.width, SOCIAL.height, { fit: 'cover', kernel: 'lanczos3' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(at(SOCIAL.output))
  console.log(
    `social: ${SOCIAL.source} ${await sizeKb(SOCIAL.source)}KB -> ` +
      `${SOCIAL.output} ${await sizeKb(SOCIAL.output)}KB (${SOCIAL.width}x${SOCIAL.height})`,
  )
}

/** The logo keeps PNG: it is a flat-colour mark with transparency and is already tiny. */
const LOGO = {
  source: path.join('favicon', 'android-chrome-512x512.png'),
  widths: [48, 96],
  name: 'logo',
}

async function buildResponsive() {
  for (const { source, widths, formats, aspect } of RESPONSIVE) {
    const stem = source.replace(/\.[^.]+$/, '')
    console.log(`responsive: ${source} ${await sizeKb(source)}KB ->`)
    for (const width of widths) {
      const height = aspect ? Math.round(width / aspect) : null
      for (const { ext, quality } of formats) {
        const output = `${stem}-${width}.${ext}`
        const pipeline = sharp(at(source)).resize(width, height, {
          fit: height ? 'cover' : 'inside',
          withoutEnlargement: true,
        })
        await (ext === 'webp'
          ? pipeline.webp({ quality, effort: 6 })
          : pipeline.jpeg({ quality, mozjpeg: true })
        ).toFile(at(output))
        console.log(`  ${output} ${await sizeKb(output)}KB`)
      }
    }
  }

  // Generated from the 512px master rather than the 192px file, so downscaling
  // starts from the most detail available.
  console.log(`responsive: ${LOGO.source} ${await sizeKb(LOGO.source)}KB ->`)
  for (const width of LOGO.widths) {
    const output = path.join('favicon', `${LOGO.name}-${width}.png`)
    await sharp(at(LOGO.source))
      .resize(width, width, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile(at(output))
    console.log(`  ${output} ${await sizeKb(output)}KB`)
  }
}

async function buildTextures() {
  let before = 0
  let after = 0
  for (const [source, output, width, quality] of TEXTURES) {
    await sharp(at(source))
      .resize(width, null, { withoutEnlargement: true })
      // Lossy alpha keeps the cloud map from ballooning past the opaque textures.
      .webp({ quality, alphaQuality: 55, effort: 6 })
      .toFile(at(output))
    const from = await sizeKb(source)
    const to = await sizeKb(output)
    before += from
    after += to
    console.log(`  ${source} ${from}KB -> ${output} ${to}KB`)
  }
  console.log(`textures: ${before}KB -> ${after}KB (${Math.round((1 - after / before) * 100)}% smaller)`)
}

await buildPoster()
await buildSocial()
await buildResponsive()
await buildTextures()
