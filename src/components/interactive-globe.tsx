import React, { useEffect, useRef, useMemo } from "react"
import * as THREE from "three"
import { FlagIcon } from '@/components/flag-icon'

interface InteractiveGlobeProps {
  className?: string
  size?: number
  autoRotateSpeed?: number
  enableZoom?: boolean
  showMarkers?: boolean
  showInstructions?: boolean
  "aria-hidden"?: boolean | "true" | "false"
}

type Destination = {
  name: string
  short: string
  flag: string
  /** ISO 3166-1 alpha-2 code for the flag icon (display names like "Surat (HQ)" don't resolve). */
  code: string
  lat: number
  lng: number
  category: "work" | "study" | "both" | "origin"
  isOrigin?: boolean
}

const DESTINATIONS: Destination[] = [
  { name: "Surat (HQ)", short: "Surat", flag: "🇮🇳", code: "in", lat: 21.1702, lng: 72.8311, category: "origin", isOrigin: true },
  { name: "United Kingdom", short: "UK", flag: "🇬🇧", code: "gb", lat: 51.5074, lng: -0.1278, category: "both" },
  { name: "Canada", short: "Canada", flag: "🇨🇦", code: "ca", lat: 43.6532, lng: -79.3832, category: "both" },
  { name: "Australia", short: "Australia", flag: "🇦🇺", code: "au", lat: -33.8688, lng: 151.2093, category: "both" },
  { name: "Japan", short: "Japan", flag: "🇯🇵", code: "jp", lat: 35.6762, lng: 139.6503, category: "work" },
  { name: "Germany", short: "Germany", flag: "🇩🇪", code: "de", lat: 50.1109, lng: 8.6821, category: "both" },
  { name: "United States", short: "USA", flag: "🇺🇸", code: "us", lat: 40.7128, lng: -74.0060, category: "both" },
  { name: "Dubai, UAE", short: "Dubai", flag: "🇦🇪", code: "ae", lat: 25.2048, lng: 55.2708, category: "both" },
  { name: "Singapore", short: "Singapore", flag: "🇸🇬", code: "sg", lat: 1.3521, lng: 103.8198, category: "both" },
  { name: "New Zealand", short: "NZ", flag: "🇳🇿", code: "nz", lat: -36.8485, lng: 174.7633, category: "both" },
  { name: "France", short: "France", flag: "🇫🇷", code: "fr", lat: 48.8566, lng: 2.3522, category: "study" },
  { name: "Russia", short: "Russia", flag: "🇷🇺", code: "ru", lat: 55.7558, lng: 37.6173, category: "work" },
]

function latLngToVec3(lat: number, lng: number, radius = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

export function InteractiveGlobe({
  className = "",
  size = 500,
  autoRotateSpeed = 0.002,
  enableZoom = true,
  showMarkers = true,
  "aria-hidden": ariaHidden,
}: InteractiveGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeHoverRef = useRef<Destination | null>(null)
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const origin = useMemo(() => DESTINATIONS.find((d) => d.isOrigin)!, [])
  const destinations = useMemo(() => DESTINATIONS.filter((d) => !d.isOrigin), [])

  useEffect(() => {
    const mount = mountRef.current
    const container = containerRef.current
    if (!mount || !container) return

    // Kept current by onResize; label projection below must use the live size.
    let width = mount.clientWidth || size
    let height = mount.clientHeight || size
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const rotateSpeed = reducedMotion ? 0 : autoRotateSpeed

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    // Far enough back that the flight arcs (up to 1.32 × radius) stay inside the frame.
    camera.position.set(0, 0, 3.45)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(width, height, false)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // CSS owns the displayed size so the canvas always matches its container.
    renderer.domElement.style.display = "block"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    mount.appendChild(renderer.domElement)

    // Master Group for 3D Earth
    const globeGroup = new THREE.Group()
    globeGroup.position.set(0, 0.02, 0)
    scene.add(globeGroup)

    // Face longitude ~55°E on load: Surat just right of centre, Europe upper-left,
    // Africa lower-left, so the routes' origin is visible in the first frame.
    globeGroup.rotation.y = -2.53
    globeGroup.rotation.x = 0.22

    // Load Photorealistic NASA Satellite Textures
    const textureLoader = new THREE.TextureLoader()
    const earthMap = textureLoader.load("/earth-blue-marble.jpg")
    earthMap.colorSpace = THREE.SRGBColorSpace
    earthMap.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4)

    const normalMap = textureLoader.load("/earth-normal.jpg")
    const specularMap = textureLoader.load("/earth-specular.jpg")
    const cloudMap = textureLoader.load("/earth-clouds.png")
    cloudMap.colorSpace = THREE.SRGBColorSpace

    // 1. Photorealistic Earth Sphere
    const globeGeo = new THREE.SphereGeometry(1, 96, 96)
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      specularMap: specularMap,
      specular: new THREE.Color(0x446688),
      shininess: 32,
      // Blue Marble oceans are very dark; a faint self-lit copy of the texture keeps
      // the whole globe readable on the light page without flattening the shading.
      emissiveMap: earthMap,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.38,
    })
    const globe = new THREE.Mesh(globeGeo, globeMat)
    globeGroup.add(globe)

    // 2. Real Atmospheric Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(1.014, 64, 64)
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
    globeGroup.add(cloudMesh)

    // 3. Atmospheric Glow
    const atmoGeo = new THREE.SphereGeometry(1.055, 48, 48)
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x60a5fa),
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    })
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat)
    globeGroup.add(atmosphere)

    // 4. Destination Markers & Beacons
    const markersGroup = new THREE.Group()
    globeGroup.add(markersGroup)

    DESTINATIONS.forEach((d) => {
      const pos = latLngToVec3(d.lat, d.lng, 1.002)
      const normal = pos.clone().normalize()

      const dotGeo = new THREE.SphereGeometry(d.isOrigin ? 0.02 : 0.012, 12, 12)
      const dotMat = new THREE.MeshBasicMaterial({
        color: d.isOrigin ? 0xfacc15 : 0x38bdf8,
      })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.copy(pos)
      markersGroup.add(dot)

      const beaconHeight = d.isOrigin ? 0.07 : 0.035
      const cylinderGeo = new THREE.CylinderGeometry(0.0025, 0.0025, beaconHeight, 6)
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: d.isOrigin ? 0xfacc15 : 0x60a5fa,
        transparent: true,
        opacity: 0.85,
      })
      const beacon = new THREE.Mesh(cylinderGeo, cylinderMat)
      beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      beacon.position.copy(pos.clone().add(normal.clone().multiplyScalar(beaconHeight / 2)))
      markersGroup.add(beacon)
    })

    // 5. Flight Route Curves
    const arcsGroup = new THREE.Group()
    globeGroup.add(arcsGroup)

    type ArcAnim = {
      curve: THREE.CatmullRomCurve3
      particle: THREE.Mesh
      progress: number
      speed: number
    }
    const arcAnimations: ArcAnim[] = []
    const originPos = latLngToVec3(origin.lat, origin.lng, 1.002)

    destinations.forEach((dest, idx) => {
      const destPos = latLngToVec3(dest.lat, dest.lng, 1.002)
      const distance = originPos.distanceTo(destPos)
      const mid = new THREE.Vector3().addVectors(originPos, destPos).multiplyScalar(0.5)
      const alt = Math.min(0.32, Math.max(0.12, distance * 0.22))
      mid.normalize().multiplyScalar(1 + alt)

      const curve = new THREE.CatmullRomCurve3([originPos, mid, destPos])
      const points = curve.getPoints(36)
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points)

      const arcMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0xf59e0b),
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      })
      const arcLine = new THREE.Line(arcGeo, arcMat)
      arcsGroup.add(arcLine)

      const partGeo = new THREE.SphereGeometry(0.011, 8, 8)
      const partMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.95,
      })
      const particle = new THREE.Mesh(partGeo, partMat)
      arcsGroup.add(particle)

      arcAnimations.push({
        curve,
        particle,
        progress: (idx * 0.12) % 1,
        speed: reducedMotion ? 0 : 0.0035 + (idx % 3) * 0.001,
      })
    })

    // 6. Signature stars: a twinkling gold star belt orbiting the planet, and
    // shooting stars that fall onto destination cities facing the viewer.
    const starTexture = (() => {
      const s = 64
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = s
      const ctx = canvas.getContext("2d")!
      const glow = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      glow.addColorStop(0, "rgba(255,255,255,1)")
      glow.addColorStop(0.16, "rgba(255,255,255,0.95)")
      glow.addColorStop(0.42, "rgba(255,255,255,0.2)")
      glow.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, s, s)
      // Four-point sparkle rays that fade toward their tips
      const horizontal = ctx.createLinearGradient(0, 0, s, 0)
      const vertical = ctx.createLinearGradient(0, 0, 0, s)
      for (const gradient of [horizontal, vertical]) {
        gradient.addColorStop(0, "rgba(255,255,255,0)")
        gradient.addColorStop(0.5, "rgba(255,255,255,0.9)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")
      }
      ctx.fillStyle = horizontal
      ctx.beginPath()
      ctx.ellipse(s / 2, s / 2, s / 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = vertical
      ctx.beginPath()
      ctx.ellipse(s / 2, s / 2, 1.5, s / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      return new THREE.CanvasTexture(canvas)
    })()

    const beltCount = width < 640 ? 170 : 340
    const beltPositions = new Float32Array(beltCount * 3)
    const beltColors = new Float32Array(beltCount * 3)
    const beltSizes = new Float32Array(beltCount)
    const beltPhases = new Float32Array(beltCount)
    // Brand golds read on both the cream page and the dark planet; a few blues for depth.
    const starPalette = [
      new THREE.Color(0xd99a1e),
      new THREE.Color(0xf2b632),
      new THREE.Color(0xb8741a),
      new THREE.Color(0x4f9fe0),
    ]
    for (let i = 0; i < beltCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.3 + Math.pow(Math.random(), 1.6) * 0.32
      beltPositions.set([Math.cos(angle) * radius, (Math.random() - 0.5) * 0.08, Math.sin(angle) * radius], i * 3)
      const color = starPalette[i % 9 === 0 ? 3 : i % 3]
      beltColors.set([color.r, color.g, color.b], i * 3)
      beltSizes[i] = i % 17 === 0 ? 30 : 9 + Math.random() * 11
      beltPhases[i] = Math.random() * Math.PI * 2
    }
    const beltGeo = new THREE.BufferGeometry()
    beltGeo.setAttribute("position", new THREE.BufferAttribute(beltPositions, 3))
    beltGeo.setAttribute("aColor", new THREE.BufferAttribute(beltColors, 3))
    beltGeo.setAttribute("aSize", new THREE.BufferAttribute(beltSizes, 1))
    beltGeo.setAttribute("aPhase", new THREE.BufferAttribute(beltPhases, 1))
    const starUniforms = {
      uTime: { value: 0 },
      uMap: { value: starTexture },
      uPixelRatio: { value: renderer.getPixelRatio() },
    }
    const beltMat = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vTwinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 1.7 + aPhase), 2.0);
          vColor = aColor;
          gl_PointSize = aSize * uPixelRatio * (0.7 + 0.45 * vTwinkle) * (3.45 / -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float alpha = texture2D(uMap, gl_PointCoord).a;
          gl_FragColor = vec4(vColor, alpha * vTwinkle);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    })
    const starBelt = new THREE.Points(beltGeo, beltMat)
    const beltPivot = new THREE.Group()
    beltPivot.rotation.set(0.38, 0, -0.24)
    beltPivot.add(starBelt)
    scene.add(beltPivot)
    // Shrink the belt on narrow (phone) frames to reduce side clipping, but never below
    // 0.85 — the belt's inner edge (1.3 × scale) must stay outside the planet (radius 1),
    // otherwise the earth hides it completely.
    const fitBelt = () => {
      const halfHeight = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const fit = (halfHeight * camera.aspect * 0.96) / 1.62
      beltPivot.scale.setScalar(Math.max(0.85, Math.min(1, fit)))
    }
    fitBelt()

    type ShootingStar = {
      line: THREE.Line
      material: THREE.ShaderMaterial
      head: THREE.Sprite
      flash: THREE.Sprite
      curve: THREE.QuadraticBezierCurve3
      progress: number
      active: boolean
      flashLife: number
    }
    const TRAIL_POINTS = 40
    const trailT = new Float32Array(TRAIL_POINTS).map((_, i) => i / (TRAIL_POINTS - 1))
    const shootingStars: ShootingStar[] = reducedMotion
      ? []
      : Array.from({ length: 3 }, () => {
          const geo = new THREE.BufferGeometry()
          geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3))
          geo.setAttribute("aT", new THREE.BufferAttribute(trailT, 1))
          const material = new THREE.ShaderMaterial({
            uniforms: { uHead: { value: 0 }, uColor: { value: new THREE.Color(0xf4b43c) } },
            vertexShader: /* glsl */ `
              attribute float aT;
              varying float vT;
              void main() {
                vT = aT;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }`,
            fragmentShader: /* glsl */ `
              uniform float uHead;
              uniform vec3 uColor;
              varying float vT;
              void main() {
                float tail = smoothstep(uHead - 0.35, uHead, vT) * step(vT, uHead);
                gl_FragColor = vec4(uColor, tail);
                #include <colorspace_fragment>
              }`,
            transparent: true,
            depthWrite: false,
          })
          const line = new THREE.Line(geo, material)
          line.visible = false
          line.frustumCulled = false
          const head = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: starTexture, color: 0xffd98a, transparent: true, depthWrite: false }),
          )
          head.scale.setScalar(0.1)
          head.visible = false
          const flash = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: starTexture, color: 0xf2a91f, transparent: true, depthWrite: false }),
          )
          flash.visible = false
          globeGroup.add(line, head, flash)
          return {
            line,
            material,
            head,
            flash,
            curve: new THREE.QuadraticBezierCurve3(),
            progress: 0,
            active: false,
            flashLife: 0,
          }
        })

    const launchShootingStar = (star: ShootingStar) => {
      // Only land on cities currently turned toward the viewer, so every impact is seen.
      const candidates = destinations.filter(
        (d) => latLngToVec3(d.lat, d.lng, 1).applyQuaternion(globeGroup.quaternion).z > 0.35,
      )
      if (!candidates.length) return false
      const target = candidates[Math.floor(Math.random() * candidates.length)]
      const end = latLngToVec3(target.lat, target.lng, 1.01)
      const start = end
        .clone()
        .multiplyScalar(2.3)
        .add(new THREE.Vector3(Math.random() - 0.5, 0.9 + Math.random() * 0.5, Math.random() - 0.5))
      const control = start.clone().lerp(end, 0.5).normalize().multiplyScalar(1.9)
      star.curve.v0.copy(start)
      star.curve.v1.copy(control)
      star.curve.v2.copy(end)
      const positions = star.line.geometry.getAttribute("position") as THREE.BufferAttribute
      for (let i = 0; i < TRAIL_POINTS; i++) {
        const point = star.curve.getPoint(trailT[i])
        positions.setXYZ(i, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
      star.progress = 0
      star.active = true
      star.line.visible = true
      star.head.visible = true
      return true
    }
    let nextShootAt = 1.2
    const clock = new THREE.Clock()

    // 7. Lighting
    // Bright, mostly frontal light so the day-side texture reads on the light page.
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.1)
    sunLight.position.set(2.5, 1.8, 5)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9)
    rimLight.position.set(-5, -2, -4)
    scene.add(rimLight)

    // Interactive Drag Controls
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let velX = 0
    let velY = 0

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
      velX = 0
      velY = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouseX
      const dy = e.clientY - prevMouseY
      velX = dx * 0.005
      velY = dy * 0.005
      globeGroup.rotation.y += velX
      globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroup.rotation.x + velY))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onPointerUp = () => {
      isDragging = false
    }

    mount.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    // Fired when the browser takes over a touch for vertical page scrolling.
    window.addEventListener("pointercancel", onPointerUp)

    // Zoom
    let targetZoom = camera.position.z
    const minZoom = 2.2
    const maxZoom = 3.9
    const onWheel = (e: WheelEvent) => {
      if (!enableZoom) return
      e.preventDefault()
      const delta = Math.sign(e.deltaY) * 0.2
      targetZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom + delta))
    }
    mount.addEventListener("wheel", onWheel, { passive: false })

    // Render & Visibility Loop Optimization
    let frameId = 0
    let isIntersecting = true
    const tempVec = new THREE.Vector3()
    const camDir = new THREE.Vector3()

    const animate = () => {
      if (!isIntersecting || document.hidden) {
        frameId = 0
        return
      }

      frameId = requestAnimationFrame(animate)

      // Damping & Auto-rotation
      if (!isDragging) {
        velX *= 0.94
        velY *= 0.94
        globeGroup.rotation.y += velX
        globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroup.rotation.x + velY))

        if (Math.abs(velX) < 0.0001 && !activeHoverRef.current) {
          globeGroup.rotation.y += rotateSpeed
        }
      }

      if (!reducedMotion) cloudMesh.rotation.y += 0.0004

      if (enableZoom) {
        camera.position.z += (targetZoom - camera.position.z) * 0.08
      }

      // Animate flight arc comet particles
      arcAnimations.forEach((arc) => {
        arc.progress = (arc.progress + arc.speed) % 1
        const pt = arc.curve.getPointAt(arc.progress)
        arc.particle.position.copy(pt)
      })

      // Direct DOM Update for 2D Labels (Bypasses React setState / re-renders)
      if (showMarkers) {
        camera.getWorldDirection(camDir)
        const camPos = camera.position.clone()

        DESTINATIONS.forEach((d) => {
          const el = labelRefs.current.get(d.name)
          if (!el) return

          const localPos = latLngToVec3(d.lat, d.lng, 1.05)
          const worldPos = localPos.clone().applyMatrix4(globeGroup.matrixWorld)

          const normalWorld = localPos.clone().normalize().applyQuaternion(globeGroup.quaternion)
          const facing = normalWorld.dot(camPos.clone().sub(worldPos).normalize())

          tempVec.copy(worldPos).project(camera)
          const x = ((tempVec.x + 1) * width) / 2
          const y = ((-tempVec.y + 1) * height) / 2
          const visible = facing > 0.08 && tempVec.z < 1
          const opacity = visible ? Math.min(1, Math.max(0, (facing - 0.08) * 3)) : 0

          if (!visible || opacity < 0.05) {
            el.style.display = "none"
          } else {
            el.style.display = "block"
            el.style.transform = `translate3d(${x}px, ${y - 6}px, 0)`
            el.style.opacity = opacity.toFixed(2)
            el.style.pointerEvents = opacity > 0.6 ? "auto" : "none"
          }
        })
      }

      // Star belt twinkle + slow independent orbit
      const elapsed = clock.getElapsedTime()
      if (!reducedMotion) {
        starUniforms.uTime.value = elapsed
        starBelt.rotation.y += 0.0009
      }

      // Shooting stars: streak in, land on a city, then a short burst of light
      if (shootingStars.length) {
        if (elapsed > nextShootAt) {
          const idle = shootingStars.find((star) => !star.active && star.flashLife <= 0)
          const launched = idle ? launchShootingStar(idle) : false
          nextShootAt = elapsed + (launched ? 2.2 + Math.random() * 2.8 : 0.6)
        }
        shootingStars.forEach((star) => {
          if (star.active) {
            star.progress = Math.min(1, star.progress + 0.022)
            const eased = Math.pow(star.progress, 1.6)
            star.material.uniforms.uHead.value = eased
            star.head.position.copy(star.curve.getPoint(eased))
            if (star.progress >= 1) {
              star.active = false
              star.line.visible = false
              star.head.visible = false
              star.flash.position.copy(star.curve.v2)
              star.flash.visible = true
              star.flashLife = 1
            }
          } else if (star.flashLife > 0) {
            star.flashLife = Math.max(0, star.flashLife - 0.035)
            star.flash.scale.setScalar(0.05 + (1 - star.flashLife) * 0.24)
            ;(star.flash.material as THREE.SpriteMaterial).opacity = star.flashLife
            if (star.flashLife === 0) star.flash.visible = false
          }
        })
      }

      renderer.render(scene, camera)
    }

    // IntersectionObserver to freeze animation frame loop when scrolled offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isIntersecting = entry.isIntersecting
        if (isIntersecting && !frameId) {
          animate()
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(container)

    const handleVisibilityChange = () => {
      if (!document.hidden && isIntersecting && !frameId) {
        animate()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial frame start
    animate()

    const onResize = () => {
      if (!mount) return
      width = mount.clientWidth || size
      height = mount.clientHeight || size
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      fitBelt()
      renderer.setSize(width, height, false)
      // Keep a correct frame on screen even while the loop is paused.
      if (!frameId) renderer.render(scene, camera)
    }
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null
    ro?.observe(mount)
    window.addEventListener("resize", onResize)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      observer.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      ro?.disconnect()
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      mount.removeEventListener("wheel", onWheel)

      // Free every mesh and line (globe, clouds, markers, beacons, arcs, particles).
      scene.traverse((object) => {
        const drawable = object as THREE.Mesh | THREE.Line
        if (!drawable.geometry) return
        drawable.geometry.dispose()
        const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material]
        materials.forEach((material) => material.dispose())
      })
      scene.remove(globeGroup, ambientLight, sunLight, rimLight)
      earthMap.dispose()
      normalMap.dispose()
      specularMap.dispose()
      cloudMap.dispose()
      starTexture.dispose()
      renderer.dispose()

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [size, autoRotateSpeed, enableZoom, showMarkers, origin, destinations])

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className}`}
      aria-hidden={ariaHidden}
      // pan-y keeps vertical page scrolling working on phones; horizontal drags still spin the globe.
      style={{ touchAction: "pan-y" }}
    >
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* 2D Projected Destination Labels on 3D Earth Surface (Direct DOM Refs) */}
      {showMarkers && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {DESTINATIONS.map((dest) => {
            const isSurat = dest.isOrigin

            return (
              <div
                key={dest.name}
                ref={(el) => {
                  if (el) labelRefs.current.set(dest.name, el)
                  else labelRefs.current.delete(dest.name)
                }}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-full transition-opacity duration-75"
                style={{ display: "none", willChange: "transform, opacity" }}
                onMouseEnter={() => { activeHoverRef.current = dest }}
                onMouseLeave={() => { activeHoverRef.current = null }}
              >
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-transform hover:scale-110 ${
                    isSurat
                      ? "border border-amber-400/80 bg-amber-500/30 text-amber-200 shadow-amber-500/20 ring-2 ring-amber-400/50"
                      : "border border-sky-400/40 bg-slate-900/80 text-slate-100 hover:border-sky-300"
                  }`}
                >
                  <FlagIcon code={dest.code} className="text-sm" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Control Badges */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md shadow-md">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Global Routes · Drag to explore</span>
      </div>
    </div>
  )
}

export default InteractiveGlobe
