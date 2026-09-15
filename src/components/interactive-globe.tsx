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

    // 6. Lighting
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
