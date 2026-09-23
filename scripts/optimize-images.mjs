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
await buildTextures()
