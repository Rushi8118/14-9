/**
 * "Lost Between Borders" globe, rendered with React Three Fiber.
 *
 * Everything is procedural — no map or star textures are downloaded:
 *  - a shaded core sphere with a fresnel rim
 *  - latitude/longitude lines
 *  - landmasses drawn as glowing dots (stylised outlines from ./geo)
 *  - destination markers and animated route arcs
 *  - an additive atmosphere shell, orbiting "traveller" particles and a starfield
 *
 * Colours use unlit (emissive-looking) materials and additive blending with a soft glow
 * texture, which reads like bloom without the cost of a post-processing pass.
 */
import { memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { COLORS, DESTINATIONS, GLOBE_RADIUS, ROUTES, isLand, latLngToVector3 } from './geo'
import { RouteArc } from './RouteArc'
import { DestinationMarker } from './DestinationMarker'
import { useGlowTexture } from './useGlowTexture'

const CAMERA_Z = 6.2
/** Start rotated so India (the journey origin) faces the viewer. */
const INITIAL_SPIN = -THREE.MathUtils.degToRad(72.83 + 90)
const BASE_TILT_X = 0.34
const ROUTE_COLORS = [COLORS.gold, COLORS.cyan, COLORS.violet] as const

type Pointer = { x: number; y: number }

export type GlobeSceneProps = {
  /** False when the tab is hidden, the globe is off-screen or reduced motion is on. */
  animate: boolean
  /** Small screens: fewer particles and a lower pixel ratio. */
  compact: boolean
  reducedMotion: boolean
  onContextLost?: () => void
}

export default function GlobeScene({ animate, compact, reducedMotion, onContextLost }: GlobeSceneProps) {
  return (
    <Canvas
      className="lbb-canvas"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      dpr={[1, compact ? 1.5 : 1.75]}
      // 'demand' stops the render loop (hidden tab, off-screen, reduced motion) while
      // still drawing a still frame, so the globe never disappears.
      frameloop={animate ? 'always' : 'demand'}
      camera={{ position: [0, 0, reducedMotion ? CAMERA_Z : CAMERA_Z + 1.8], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault()
            onContextLost?.()
          },
          { once: true },
        )
      }}
    >
      <Scene animate={animate} compact={compact} />
    </Canvas>
  )
}

function Scene({ animate, compact }: { animate: boolean; compact: boolean }) {
  const pointer = useWindowPointer()
  return (
    <>
      <Starfield count={compact ? 420 : 900} animate={animate} />
      <CameraRig pointer={pointer} animate={animate} />
      <Globe pointer={pointer} animate={animate} compact={compact} />
    </>
  )
}

/** Tracks the pointer across the whole window (not just the canvas) as -1…1 values. */
function useWindowPointer() {
  const pointer = useRef<Pointer>({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return pointer
}

/** Smooth camera: an intro dolly-in plus gentle parallax that follows the pointer. */
function CameraRig({ pointer, animate }: { pointer: RefObject<Pointer>; animate: boolean }) {
  useFrame((state, delta) => {
    if (!animate) return
    const { camera, clock } = state
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.current.x * 0.55, 1.6, delta)
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      pointer.current.y * 0.35 + Math.sin(clock.elapsedTime * 0.12) * 0.08,
      1.6,
      delta,
    )
    camera.position.z = THREE.MathUtils.damp(camera.position.z, CAMERA_Z, 1.1, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Globe({ pointer, animate, compact }: { pointer: RefObject<Pointer>; animate: boolean; compact: boolean }) {
  const tilt = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)

  const anchors = useMemo(
    () => new Map(DESTINATIONS.map((d) => [d.id, latLngToVector3(d.lat, d.lng, GLOBE_RADIUS * 1.008)])),
    [],
  )

  useFrame((state, delta) => {
    if (!animate || !tilt.current || !spin.current) return
    // Slow continuous rotation around the globe's own axis.
    spin.current.rotation.y += delta * 0.055
    // Subtle float plus a small tilt toward the pointer.
    tilt.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.07
    tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, BASE_TILT_X - pointer.current.y * 0.1, 2.2, delta)
    tilt.current.rotation.z = THREE.MathUtils.damp(tilt.current.rotation.z, -0.1 + pointer.current.x * 0.06, 2.2, delta)
  })

  return (
    <group ref={tilt} rotation={[BASE_TILT_X, 0, -0.1]} scale={compact ? 0.94 : 1}>
      <group ref={spin} rotation={[0, INITIAL_SPIN, 0]}>
        <GlobeCore />
        <Graticule />
        <LandDots samples={compact ? 9000 : 16000} />
        {DESTINATIONS.map((destination) => (
          <DestinationMarker key={destination.id} destination={destination} animate={animate} />
        ))}
        {ROUTES.map(([fromId, toId], index) => {
          const from = anchors.get(fromId)
          const to = anchors.get(toId)
          if (!from || !to) return null
          return (
            <RouteArc
              key={`${fromId}-${toId}`}
              from={from}
              to={to}
              color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
              offset={index / ROUTES.length}
              speed={0.07 + (index % 3) * 0.015}
              animate={animate}
            />
          )
        })}
      </group>
      <Atmosphere />
      <OrbitParticles count={compact ? 160 : 320} animate={animate} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Core sphere: deep navy with a soft key light and a cyan fresnel rim.
// It writes depth, so dots, arcs and markers on the far side are hidden.
// ---------------------------------------------------------------------------
const coreVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const coreFragmentShader = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 3.0);
    float light = clamp(dot(vNormal, normalize(vec3(-0.4, 0.6, 0.7))), 0.0, 1.0);
    vec3 color = mix(uDeep, uMid, light * 0.65) + uRim * fresnel * 0.85;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const GlobeCore = memo(function GlobeCore() {
  const uniforms = useMemo(
    () => ({
      uDeep: { value: new THREE.Color(COLORS.deep) },
      uMid: { value: new THREE.Color(COLORS.mid) },
      uRim: { value: new THREE.Color(COLORS.cyan) },
    }),
    [],
  )
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <shaderMaterial vertexShader={coreVertexShader} fragmentShader={coreFragmentShader} uniforms={uniforms} />
    </mesh>
  )
})

// ---------------------------------------------------------------------------
// Latitude / longitude grid, built once as a single LineSegments draw call.
// ---------------------------------------------------------------------------
function buildGraticule(radius: number, step = 15, segments = 96) {
  const positions: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const pushSegment = () => positions.push(a.x, a.y, a.z, b.x, b.y, b.z)

  for (let lat = -75; lat <= 75; lat += step) {
    for (let i = 0; i < segments; i++) {
      latLngToVector3(lat, -180 + (360 * i) / segments, radius, a)
      latLngToVector3(lat, -180 + (360 * (i + 1)) / segments, radius, b)
      pushSegment()
    }
  }
  const half = segments / 2
  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < half; i++) {
      latLngToVector3(-90 + (180 * i) / half, lng, radius, a)
      latLngToVector3(-90 + (180 * (i + 1)) / half, lng, radius, b)
      pushSegment()
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

const Graticule = memo(function Graticule() {
  const geometry = useMemo(() => buildGraticule(GLOBE_RADIUS * 1.002), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={COLORS.royal}
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  )
})

// ---------------------------------------------------------------------------
// Landmasses: evenly spaced Fibonacci-sphere samples, kept only where they fall
// inside a continent outline. Points on a single geometry = one draw call.
// ---------------------------------------------------------------------------
const LandDots = memo(function LandDots({ samples }: { samples: number }) {
  const texture = useGlowTexture()
  const geometry = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const cyan = new THREE.Color(COLORS.cyan)
    const royal = new THREE.Color(COLORS.royal)
    const violet = new THREE.Color(COLORS.violet)
    const color = new THREE.Color()
    const point = new THREE.Vector3()
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < samples; i++) {
      const y = 1 - (i / (samples - 1)) * 2
      const lat = THREE.MathUtils.radToDeg(Math.asin(y))
      let lng = THREE.MathUtils.radToDeg(goldenAngle * i) % 360
      if (lng > 180) lng -= 360
      if (!isLand(lat, lng)) continue

      latLngToVector3(lat, lng, GLOBE_RADIUS * 1.006, point)
      positions.push(point.x, point.y, point.z)
      // Royal blue in the south shading to cyan in the north, with a violet cast near the poles.
      const t = (lat + 90) / 180
      color.copy(royal).lerp(cyan, t).lerp(violet, Math.max(0, Math.abs(lat) / 90 - 0.55))
      colors.push(color.r, color.g, color.b)
    }

    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    result.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return result
  }, [samples])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.034}
        sizeAttenuation
        map={texture}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
})

// ---------------------------------------------------------------------------
// Atmosphere: a slightly larger back-faced shell whose intensity rises toward
// the silhouette, blended additively for a soft halo (cyan below, violet above).
// ---------------------------------------------------------------------------
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(clamp(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.6);
    vec3 color = mix(uInner, uOuter, clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(color * intensity * 1.35, intensity);
    #include <colorspace_fragment>
  }
`

const Atmosphere = memo(function Atmosphere() {
  const uniforms = useMemo(
    () => ({
      uInner: { value: new THREE.Color(COLORS.cyan) },
      uOuter: { value: new THREE.Color(COLORS.violet) },
    }),
    [],
  )
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
})

// ---------------------------------------------------------------------------
// Orbiting particles ("travellers and opportunities") on a tilted band.
// ---------------------------------------------------------------------------
function OrbitParticles({ count, animate }: { count: number; animate: boolean }) {
  const points = useRef<THREE.Points>(null)
  const texture = useGlowTexture()
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const cyan = new THREE.Color(COLORS.cyan)
    const violet = new THREE.Color(COLORS.violet)
    const gold = new THREE.Color(COLORS.gold)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = GLOBE_RADIUS * (1.28 + Math.random() * 0.42)
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.35
      positions[i * 3 + 2] = Math.sin(angle) * radius
      if (Math.random() < 0.14) color.copy(gold)
      else color.copy(cyan).lerp(violet, Math.random() * 0.7)
      color.toArray(colors, i * 3)
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return result
  }, [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (animate && points.current) points.current.rotation.y += delta * 0.05
  })

  return (
    <group rotation={[0.42, 0, 0.18]}>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          map={texture}
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Distant starfield on a spherical shell, drifting very slowly.
// ---------------------------------------------------------------------------
function Starfield({ count, animate }: { count: number; animate: boolean }) {
  const points = useRef<THREE.Points>(null)
  const texture = useGlowTexture(32)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const direction = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      direction.randomDirection().multiplyScalar(14 + Math.random() * 18)
      direction.toArray(positions, i * 3)
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return result
  }, [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (animate && points.current) points.current.rotation.y += delta * 0.004
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.14}
        sizeAttenuation
        map={texture}
        color="#c9d8ff"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
