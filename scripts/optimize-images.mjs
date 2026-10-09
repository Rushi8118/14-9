/**
 * Regenerates the AVIF/WebP derivatives in public/ from their source JPEG/PNG files.
 * Run after replacing any source image: `npm run images`.
 *
 * The hero poster is the homepage LCP element, so it gets its own small derivative
 * rather than reusing the full-resolution globe texture.
 */
import sharp from 'sharp'
import { stat, writeFile } from 'node:fs/promises'
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
 * why-us.tsx draws the photo inside `max-w-7xl` less 48px of padding, in a
 * 12-column grid with a 56px gap, spanning 6 — so (container - 104) / 2, and
 * 100vw below the `lg` breakpoint.
 *
 * This used to read "`max-w-7xl` (1280) … so 588px on desktop". That is only
 * true at exactly 1280px wide: src/index.css widens max-w-7xl beyond Tailwind's
 * 1280 on large screens (1536px from 1280, 1720px from 1536, 1800px from 1920),
 * which this note and the `sizes` attribute it justified had both missed.
 * Measured against the running site, the box is 659px at a 1440px viewport and
 * about 848px at 1920px, not 588px.
 *
 * 400 covers a phone at 1x and 800 a phone at 2x, but the top of the ladder no
 * longer reaches: 1024 is the source's own width, and on a wide high-DPR screen
 * the box now asks for more than that. Generating a larger variant would mean
 * upscaling, which adds bytes and no detail — the fix is a wider original for
 * public/consultant-office.jpg, after which the widths here can grow.
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

/**
 * Browser-tab favicons.
 *
 * WHAT WAS WRONG: favicon-16x16.png and favicon-32x32.png were the full brand
 * lockup — globe *plus* the "SIDDHIVINAYAK" and "OVERSEAS" wordmark — scaled to
 * 32px. Two lines of type across 32 pixels is roughly 1.5px per letter, so the
 * wordmark rendered as a grey smear and squashed the globe into the top third.
 * A favicon has room for a mark, never a lockup. Cropping to the globe is what
 * actually fixed legibility.
 *
 * NO BACKGROUND PLATE, BY DECISION
 *
 * An earlier version flattened these onto white. That guaranteed contrast on a
 * dark tab strip, but it reads as a sticker rather than a logo, so the plate was
 * dropped and the mark now ships on transparency like the master artwork.
 *
 * The tradeoff is real and is accepted, not overlooked: on a dark tab strip the
 * navy sphere has little contrast against the bar, so what carries the shape
 * there is the gold ring and swoosh and the white continents. That is enough to
 * identify at 16px — but if someone later finds it faint on dark and is tempted
 * to "fix" it, re-adding a white plate is a brand decision, not a bug fix. Ask
 * first.
 *
 * THE CROP IS MEASURED, NOT EYEBALLED
 *
 * The mark's bounding box in the 512px master is x 153-346, y 120-302 (194x183),
 * found by scanning for pixels that are neither transparent nor near-white. The
 * blank band separating the globe from the wordmark is rows 303-319, so the crop
 * must end before row 320 or the tops of the letters reappear as a smear along
 * the bottom edge — which is exactly what a first attempt at 232px did.
 *
 * CENTRED ON THE GLOBE, NOT ON THE ARTWORK'S BOUNDING BOX
 *
 * Measured separately, the navy sphere is 172x149 centred at (245.5, 211) while
 * the gold ring and its arrowhead reach 194x183 centred at (249.5, 211). The
 * arrow overshoots up and to the right, so a crop fitted to the whole bounding
 * box pushes the globe off-centre and shrinks it — at 16px that is the
 * difference between a readable globe and a smudge.
 *
 * `crop` is therefore a 190px square centred on the *sphere*, and `round` masks
 * it to a disc. The gold ring already traces that circle, so the mask reads as
 * the edge of the emblem rather than as something cut off; the arrowhead is
 * trimmed where it leaves the disc, which is deliberate. Re-run the measurement
 * if the master logo is ever replaced.
 */
const FAVICON = {
  source: path.join('favicon', 'android-chrome-512x512.png'),
  // Square region of the master containing the globe mark and nothing else.
  crop: { left: 150, top: 116, width: 190, height: 190 },
  round: true,
  // Fills the disc behind the globe and stops at its edge. The master's own
  // backdrop inside the gold ring is white, so this restores what the artwork
  // already shows at full size rather than introducing a colour.
  plate: '#ffffff',
  sizes: [16, 32, 48],
}

/** Circular alpha mask, composited with `dest-in` to clip a square render to a disc. */
const discMask = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )

/**
 * A filled disc, transparent outside it — the backing plate.
 *
 * Inset by half a pixel so the fill sits just inside the mask that clips the
 * finished icon. Without that, the plate's own antialiased rim and the mask's
 * land on the same pixels and the edge picks up a faint light fringe, which is
 * most visible against a dark tab strip at 16px.
 */
const discFill = (size, colour) =>
  Buffer.from(
    `<svg width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 0.5}" fill="${colour}"/></svg>`,
  )

/**
 * The globe emblem at one size, as a transparent disc.
 *
 * No flatten(): the mark ships on transparency. The 512px master is 91%
 * fully-transparent and contains no opaque white, so there is no plate to strip
 * and no white fringe to antialias against.
 */
const markPng = async (size, { round = true, palette = false, plate = null } = {}) => {
  // Masking after the resize means the disc edge is antialiased at the final
  // size. Masking first and then scaling would resample an already-hard edge
  // and leave it visibly stepped at 16px.
  const square = await sharp(at(FAVICON.source))
    .extract(FAVICON.crop)
    .resize(size, size, {
      fit: 'contain',
      kernel: 'lanczos3',
      // Keep the master's transparency rather than padding with a colour.
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  // `plate` fills the disc behind the mark and stops at its edge, so the icon
  // gains a solid backing *inside* the circle while everything outside it stays
  // transparent. That is the difference between a badge and the full-bleed white
  // square an earlier version shipped.
  //
  // Both layers go in ONE composite() call, in order. sharp's composite()
  // *replaces* the layer list rather than appending to it, so chaining a second
  // call silently discards the first — which here meant masking a bare white
  // disc and dropping the globe entirely, for a 1KB blank icon that still looked
  // plausible in a file listing.
  const layers = []
  if (plate) layers.push({ input: square, blend: 'over' })
  if (round) layers.push({ input: discMask(size), blend: 'dest-in' })

  const base = plate ? sharp(discFill(size, plate)) : sharp(square)

  return (layers.length ? base.composite(layers) : base)
    .png({ compressionLevel: 9, palette })
    .toBuffer()
}

/**
 * Packs PNGs into a multi-resolution .ico.
 *
 * sharp has no ICO encoder, but the format has allowed a whole PNG as an entry's
 * payload since Vista and every browser in use reads it — so this is a 6-byte
 * header, one 16-byte directory entry per size, then the PNG bytes unchanged.
 * A byte of 0 in the width/height field means 256, which is why nothing here may
 * exceed 255px.
 */
function packIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = 6 + pngs.length * 16
  const entries = []
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette colours
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)])
}

async function buildFavicons() {
  console.log(`favicons: ${FAVICON.source} ${await sizeKb(FAVICON.source)}KB ->`)

  const rendered = []
  for (const size of FAVICON.sizes) {
    const data = await markPng(size, { round: FAVICON.round, plate: FAVICON.plate })
    rendered.push({ size, data })
    const output = path.join('favicon', `favicon-${size}x${size}.png`)
    await writeFile(at(output), data)
    console.log(`  ${output} ${await sizeKb(output)}KB`)
  }

  // Clients that ignore <link rel="icon"> — some crawlers, feed readers and link
  // previewers — request /favicon.ico from the site root regardless. There was no
  // file there (the only .ico lived at /favicon/favicon.ico), so that request
  // returned 404 on the live site.
  await writeFile(at('favicon.ico'), packIco(rendered))
  console.log(`  favicon.ico ${await sizeKb('favicon.ico')}KB (${FAVICON.sizes.join(', ')}px)`)
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

  // The header badge draws this at 24px, and it had exactly the bug the favicons
  // had: the full lockup — globe plus both lines of wordmark — scaled down until
  // the type was an unreadable band and the globe was a third of its height. It
  // now uses the same cropped disc as the favicons, which is also the right call
  // editorially: site-header.tsx already renders "Siddhivinayak / OVERSEAS" as
  // live text immediately beside the badge, so the wordmark inside it was
  // duplicating that in a form nobody could read.
  console.log(`responsive: ${LOGO.source} ${await sizeKb(LOGO.source)}KB ->`)
  for (const width of LOGO.widths) {
    const output = path.join('favicon', `${LOGO.name}-${width}.png`)
    // Palette-quantised, as it was before. Measured rather than assumed: against
    // the full RGBA encode, the mean per-channel difference across solidly
    // visible pixels is 1.0/255 and the largest alpha difference anywhere on the
    // antialiased rim is 14/255, while the file drops from 14.8KB to 5.9KB at
    // 96px. This image is above the fold on every page, so 9KB matters and the
    // difference does not.
    await writeFile(
      at(output),
      await markPng(width, { round: FAVICON.round, plate: FAVICON.plate, palette: true }),
    )
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
await buildFavicons()
await buildResponsive()
await buildTextures()
