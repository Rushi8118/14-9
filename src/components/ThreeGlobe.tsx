import { useEffect, useRef } from "react"
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SRGBColorSpace,
  SphereGeometry,
  MeshPhongMaterial,
  Mesh,
  Color,
  CanvasTexture,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  AmbientLight,
  DirectionalLight,
  Group,
  MeshBasicMaterial,
  BackSide,
} from "three"

interface ThreeGlobeProps {
  className?: string
  size?: number
}

function generateEarthTexture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  const ocean = [25, 55, 95]
  const shallow = [35, 85, 130]
  const land = [60, 130, 70]
  const dryLand = [130, 150, 70]
  const sand = [180, 170, 120]
  const ice = [220, 230, 240]
  const forest = [40, 100, 50]

  function noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return n - Math.floor(n)
  }

  function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const n00 = noise(ix, iy)
    const n10 = noise(ix + 1, iy)
    const n01 = noise(ix, iy + 1)
    const n11 = noise(ix + 1, iy + 1)
    return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy
  }

  function fbm(x: number, y: number, octaves: number): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxVal = 0
    for (let i = 0; i < octaves; i++) {
      value += amplitude * smoothNoise(x * frequency, y * frequency)
      maxVal += amplitude
      amplitude *= 0.5
      frequency *= 2
    }
    return value / maxVal
  }

  function pseudoMercator(lat: number): number {
    return Math.log(Math.tan(Math.PI / 4 + lat / 2))
  }

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const u = px / width
      const v = py / height
      const lon = u * 2 * Math.PI
      const lat = (1 - v) * Math.PI
      const x3 = Math.cos(lat) * Math.cos(lon)
      const y3 = Math.cos(lat) * Math.sin(lon)
      const z3 = Math.sin(lat)

      const nx = x3 * 2.5 + 3.7
      const ny = y3 * 2.5 + 5.1
      const nz = z3 * 2.5 + 2.3
      const continentality = fbm(nx, ny, 6) * 0.6 + fbm(nz * 0.8, nx * 0.7 + 2, 4) * 0.4

      const latAbs = Math.abs(lat)
      const polar = latAbs > 1.2 ? Math.min(1, (latAbs - 1.2) / 0.3) : 0

      const idx = (py * width + px) * 4
      let r: number, g: number, b: number

      if (polar > 0.6 && continentality > 0.3) {
        r = ice[0]; g = ice[1]; b = ice[2]
      } else if (continentality > 0.52) {
        const elevation = (continentality - 0.52) / 0.48
        if (elevation < 0.3) {
          const t = elevation / 0.3
          r = land[0] + (forest[0] - land[0]) * t
          g = land[1] + (forest[1] - land[1]) * t
          b = land[2] + (forest[2] - land[2]) * t
        } else if (elevation < 0.6) {
          const t = (elevation - 0.3) / 0.3
          r = forest[0] + (dryLand[0] - forest[0]) * t
          g = forest[1] + (dryLand[1] - forest[1]) * t
          b = forest[2] + (dryLand[2] - forest[2]) * t
        } else if (elevation < 0.8) {
          const t = (elevation - 0.6) / 0.2
          r = dryLand[0] + (sand[0] - dryLand[0]) * t
          g = dryLand[1] + (sand[1] - dryLand[1]) * t
          b = dryLand[2] + (sand[2] - dryLand[2]) * t
        } else {
          const t = Math.min(1, (elevation - 0.8) / 0.2)
          r = sand[0] + (ice[0] - sand[0]) * t * 0.5
          g = sand[1] + (ice[1] - sand[1]) * t * 0.5
          b = sand[2] + (ice[2] - sand[2]) * t * 0.5
        }
      } else if (continentality > 0.4) {
        const t = (continentality - 0.4) / 0.12
        r = ocean[0] + (land[0] - ocean[0]) * t
        g = ocean[1] + (land[1] - ocean[1]) * t
        b = ocean[2] + (land[2] - ocean[2]) * t
      } else if (continentality > 0.35) {
        const t = (continentality - 0.35) / 0.05
        r = shallow[0] + (ocean[0] - shallow[0]) * t
        g = shallow[1] + (ocean[1] - shallow[1]) * t
        b = shallow[2] + (ocean[2] - shallow[2]) * t
      } else {
        const depth = Math.max(0, continentality / 0.35)
        r = ocean[0] - depth * 15
        g = ocean[1] - depth * 25
        b = ocean[2] - depth * 10
      }

      data[idx] = Math.max(0, Math.min(255, r))
      data[idx + 1] = Math.max(0, Math.min(255, g))
      data[idx + 2] = Math.max(0, Math.min(255, b))
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function generateCloudTexture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  function noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return n - Math.floor(n)
  }

  function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const n00 = noise(ix, iy)
    const n10 = noise(ix + 1, iy)
    const n01 = noise(ix, iy + 1)
    const n11 = noise(ix + 1, iy + 1)
    return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy
  }

  function fbm(x: number, y: number): number {
    let value = 0
    let amp = 1
    let freq = 1
    let max = 0
    for (let i = 0; i < 5; i++) {
      value += amp * smoothNoise(x * freq, y * freq)
      max += amp
      amp *= 0.5
      freq *= 2.3
    }
    return value / max
  }

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const u = px / width
      const v = py / height
      const idx = (py * width + px) * 4
      const n = fbm(u * 6 + 10, v * 6 + 10)
      const val = Math.max(0, Math.min(255, Math.round(n * 255)))
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
      data[idx + 3] = val > 180 ? Math.round((val - 180) * 2.5) : 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function ThreeGlobe({ className = "", size = 500 }: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const width = mount.clientWidth || size
    const height = mount.clientHeight || size
    const dpr = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
    const segments = isMobile ? 48 : 72

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 2.8

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const texCanvas = generateEarthTexture(1024, 512)
    const earthTexture = new CanvasTexture(texCanvas)
    earthTexture.colorSpace = SRGBColorSpace
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const globeGeometry = new SphereGeometry(1, segments, segments)
    const globeMaterial = new MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthTexture,
      bumpScale: 0.03,
      shininess: 10,
      specular: new Color(0x445566),
    })
    const globe = new Mesh(globeGeometry, globeMaterial)
    scene.add(globe)

    const cloudCanvas = generateCloudTexture(512, 256)
    const cloudTexture = new CanvasTexture(cloudCanvas)
    cloudTexture.colorSpace = SRGBColorSpace
    const cloudGeometry = new SphereGeometry(1.016, segments, segments)
    const cloudMaterial = new MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
    const cloudMesh = new Mesh(cloudGeometry, cloudMaterial)
    scene.add(cloudMesh)

    const innerGlow = new Mesh(
      new SphereGeometry(1.04, 48, 48),
      new MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.06,
        side: BackSide,
      }),
    )
    scene.add(innerGlow)

    const outerGlow = new Mesh(
      new SphereGeometry(1.12, 48, 48),
      new MeshBasicMaterial({
        color: 0x4488cc,
        transparent: true,
        opacity: 0.04,
        side: BackSide,
      }),
    )
    scene.add(outerGlow)

    const ambient = new AmbientLight(0xffffff, 0.45)
    scene.add(ambient)
    const keyLight = new DirectionalLight(0xfbbf24, 1.8)
    keyLight.position.set(5, 3, 5)
    scene.add(keyLight)
    const fillLight = new DirectionalLight(0x6366f1, 0.6)
    fillLight.position.set(-4, -1, -3)
    scene.add(fillLight)
    const rimLight = new DirectionalLight(0x93c5fd, 0.4)
    rimLight.position.set(-2, 1, -5)
    scene.add(rimLight)

    let starGroup: Group | null = null
    if (!prefersReduced) {
      const starCount = isMobile ? 1200 : 3000
      const palette = [
        new Color(0xffffff),
        new Color(0xdbeafe),
        new Color(0xfef3c7),
        new Color(0xfde68a),
      ]
      const starsGeometry = new BufferGeometry()
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)
      for (let i = 0; i < starCount; i++) {
        const r = 3 + Math.random() * 15
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const c = palette[Math.floor(Math.random() * palette.length)]
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }
      starsGeometry.setAttribute("position", new BufferAttribute(positions, 3))
      starsGeometry.setAttribute("color", new BufferAttribute(colors, 3))
      const stars = new Points(
        starsGeometry,
        new PointsMaterial({
          size: isMobile ? 0.014 : 0.018,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          sizeAttenuation: true,
        }),
      )
      starGroup = new Group()
      starGroup.add(stars)
      scene.add(starGroup)
    }

    const speed = prefersReduced ? 0 : 0.003
    let frameId = 0
    const animate = () => {
      frameId = window.requestAnimationFrame(animate)
      globe.rotation.y += speed
      cloudMesh.rotation.y += speed * 0.7
      innerGlow.rotation.copy(globe.rotation)
      outerGlow.rotation.copy(globe.rotation)
      if (starGroup) {
        starGroup.rotation.y += 0.00015
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = mount.clientWidth || size
      const h = mount.clientHeight || size
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const ro = "ResizeObserver" in window ? new ResizeObserver(handleResize) : null
    ro?.observe(mount)
    window.addEventListener("resize", handleResize)

    return () => {
      window.cancelAnimationFrame(frameId)
      ro?.disconnect()
      window.removeEventListener("resize", handleResize)
      scene.remove(globe, cloudMesh, innerGlow, outerGlow, starGroup!, ambient, keyLight, fillLight, rimLight)
      globeGeometry.dispose()
      globeMaterial.dispose()
      earthTexture.dispose()
      cloudGeometry.dispose()
      cloudMaterial.dispose()
      cloudTexture.dispose()
      ;(innerGlow.geometry as SphereGeometry).dispose()
      ;(innerGlow.material as MeshBasicMaterial).dispose()
      ;(outerGlow.geometry as SphereGeometry).dispose()
      ;(outerGlow.material as MeshBasicMaterial).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [size, isMobile])

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="h-full w-full" style={{ minHeight: size }} />
    </div>
  )
}

export default ThreeGlobe
