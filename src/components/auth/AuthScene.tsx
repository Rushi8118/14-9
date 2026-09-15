import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MathUtils,
  type BufferGeometry,
  type Group,
  type Sprite,
  type SpriteMaterial,
} from 'three'

export type AuthSceneVariant = 'login' | 'register'

type AuthSceneProps = {
  variant: AuthSceneVariant
  /** Runs the render loop; false renders a single still frame (reduced motion, hidden tab, off-screen). */
  animate: boolean
  /** Enables the pointer/touch response. */
  interactive: boolean
  lowPower: boolean
  onContextLost?: () => void
}

type Palette = { node: string; accent: string; line: string; linkDistance: number }

// Gold is the brand primary; each page pairs it with a different cool accent.
const PALETTES: Record<AuthSceneVariant, Palette> = {
  login: { node: '#f0c064', accent: '#9db8ff', line: '#8aa6ff', linkDistance: 1.35 },
  register: { node: '#7fdff2', accent: '#f0c064', line: '#e9b95a', linkDistance: 1.25 },
}

const CAMERA_Z = 8
const MAX_SEGMENTS = 900
const POINTER_RADIUS = 1.7
const BOUNDS = { x: 3.4, y: 4, z: 1.4 }
const RIBBONS = 5

/** Small deterministic PRNG so the layout is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createNodes(count: number, variant: AuthSceneVariant) {
  const random = mulberry32(variant === 'login' ? 1307 : 4481)
  const base = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const speed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    base[i * 3] = (random() * 2 - 1) * BOUNDS.x
    base[i * 3 + 1] =
      variant === 'login'
        ? (random() * 2 - 1) * BOUNDS.y
        : -BOUNDS.y + 0.8 + ((i % RIBBONS) + 0.5) * ((BOUNDS.y * 2 - 1.6) / RIBBONS) + (random() - 0.5) * 0.35
    base[i * 3 + 2] = (random() * 2 - 1) * BOUNDS.z
    phase[i] = random() * Math.PI * 2
    speed[i] = 0.6 + random() * 0.8
  }
  return { base, phase, speed }
}

function useDotTexture() {
  const texture = useMemo(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const context = canvas.getContext('2d')!
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
    return new CanvasTexture(canvas)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** Tracks the pointer (mouse or touch) relative to the canvas, in -1..1 coordinates. */
function usePointer(enabled: boolean) {
  const gl = useThree((state) => state.gl)
  const pointer = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    if (!enabled) return
    const update = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      pointer.current.x = x
      pointer.current.y = y
      pointer.current.active = Math.abs(x) <= 1.15 && Math.abs(y) <= 1.15
    }
    const leave = () => {
      pointer.current.active = false
    }
    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('pointerdown', update, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerdown', update)
      document.documentElement.removeEventListener('pointerleave', leave)
      pointer.current.active = false
    }
  }, [enabled, gl])

  return pointer
}

function ContextLossListener({ onContextLost }: { onContextLost?: () => void }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    if (!onContextLost) return
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', onContextLost)
    return () => canvas.removeEventListener('webglcontextlost', onContextLost)
  }, [gl, onContextLost])
  return null
}

function Constellation({ variant, animate, interactive, lowPower }: Omit<AuthSceneProps, 'onContextLost'>) {
  const palette = PALETTES[variant]
  const count = lowPower ? 48 : variant === 'login' ? 84 : 96
  const texture = useDotTexture()
  const pointer = usePointer(interactive)

  const groupRef = useRef<Group>(null)
  const pointsRef = useRef<BufferGeometry>(null)
  const linesRef = useRef<BufferGeometry>(null)
  const haloRef = useRef<Sprite>(null)
  const time = useRef(0)
  const pull = useRef({ x: 0, y: 0, strength: 0 })

  const nodes = useMemo(() => createNodes(count, variant), [count, variant])
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const nodeColors = useMemo(() => {
    const colors = new Float32Array(count * 3)
    const node = new Color(palette.node)
    const accent = new Color(palette.accent)
    for (let i = 0; i < count; i++) {
      const color = i % 5 === 0 ? accent : node
      colors.set([color.r, color.g, color.b], i * 3)
    }
    return colors
  }, [count, palette])
  const linePositions = useMemo(() => new Float32Array(MAX_SEGMENTS * 6), [])
  const lineColors = useMemo(() => new Float32Array(MAX_SEGMENTS * 6), [])
  const lineColor = useMemo(() => new Color(palette.line), [palette])

  useFrame((state, delta) => {
    if (animate) time.current += Math.min(delta, 0.05)
    const t = time.current
    const { base, phase, speed } = nodes
    const viewport = state.viewport.getCurrentViewport(state.camera, [0, 0, 0])

    // Ease the pointer's influence in and out so nothing jumps.
    const target = interactive && pointer.current.active ? 1 : 0
    const ease = animate ? 1 - Math.exp(-delta * 4) : 1
    pull.current.strength += (target - pull.current.strength) * ease
    if (pointer.current.active) {
      pull.current.x += ((pointer.current.x * viewport.width) / 2 - pull.current.x) * ease
      pull.current.y += ((pointer.current.y * viewport.height) / 2 - pull.current.y) * ease
    }

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const bx = base[i3]
      const by = base[i3 + 1]
      const bz = base[i3 + 2]
      let x: number
      let y: number
      let z: number
      if (variant === 'login') {
        // Slow drift, like stars settling into a constellation.
        x = bx + Math.sin(t * 0.22 * speed[i] + phase[i]) * 0.35
        y = by + Math.cos(t * 0.18 * speed[i] + phase[i] * 1.3) * 0.35
        z = bz + Math.sin(t * 0.15 + phase[i]) * 0.3
      } else {
        // Points travel left-to-right along gentle waves — journeys in motion.
        const span = BOUNDS.x * 2 + 0.8
        x = ((((bx + BOUNDS.x + 0.4 + t * 0.12 * speed[i]) % span) + span) % span) - BOUNDS.x - 0.4
        y = by + Math.sin(x * 0.85 + t * 0.5 + (i % RIBBONS) * 0.7) * 0.45
        z = bz + Math.cos(x * 0.6 + t * 0.3) * 0.4
      }

      // Nodes near the pointer part softly around it.
      if (pull.current.strength > 0.001) {
        const dx = x - pull.current.x
        const dy = y - pull.current.y
        const distance = Math.hypot(dx, dy)
        if (distance < POINTER_RADIUS && distance > 0.0001) {
          const push = (1 - distance / POINTER_RADIUS) ** 2 * 0.45 * pull.current.strength
          x += (dx / distance) * push
          y += (dy / distance) * push
        }
      }

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z
    }

    let segments = 0
    const maxDistance = palette.linkDistance
    const addSegment = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, alpha: number) => {
      const s6 = segments * 6
      linePositions[s6] = ax
      linePositions[s6 + 1] = ay
      linePositions[s6 + 2] = az
      linePositions[s6 + 3] = bx
      linePositions[s6 + 4] = by
      linePositions[s6 + 5] = bz
      const r = lineColor.r * alpha
      const g = lineColor.g * alpha
      const b = lineColor.b * alpha
      lineColors[s6] = lineColors[s6 + 3] = r
      lineColors[s6 + 1] = lineColors[s6 + 4] = g
      lineColors[s6 + 2] = lineColors[s6 + 5] = b
      segments++
    }

    for (let i = 0; i < count && segments < MAX_SEGMENTS; i++) {
      const i3 = i * 3
      for (let j = i + 1; j < count && segments < MAX_SEGMENTS; j++) {
        const j3 = j * 3
        const dx = positions[i3] - positions[j3]
        const dy = positions[i3 + 1] - positions[j3 + 1]
        const dz = positions[i3 + 2] - positions[j3 + 2]
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (distance < maxDistance) {
          addSegment(positions[i3], positions[i3 + 1], positions[i3 + 2], positions[j3], positions[j3 + 1], positions[j3 + 2], (1 - distance / maxDistance) * 0.5)
        }
      }
    }

    // The pointer becomes a faint glowing node that links to its neighbours.
    if (pull.current.strength > 0.01) {
      for (let i = 0; i < count && segments < MAX_SEGMENTS; i++) {
        const i3 = i * 3
        const distance = Math.hypot(positions[i3] - pull.current.x, positions[i3 + 1] - pull.current.y)
        if (distance < POINTER_RADIUS * 1.15) {
          addSegment(pull.current.x, pull.current.y, 0, positions[i3], positions[i3 + 1], positions[i3 + 2], (1 - distance / (POINTER_RADIUS * 1.15)) * 0.7 * pull.current.strength)
        }
      }
    }

    const pointsGeometry = pointsRef.current
    if (pointsGeometry) pointsGeometry.attributes.position.needsUpdate = true
    const linesGeometry = linesRef.current
    if (linesGeometry) {
      linesGeometry.attributes.position.needsUpdate = true
      linesGeometry.attributes.color.needsUpdate = true
      linesGeometry.setDrawRange(0, segments * 2)
    }

    const halo = haloRef.current
    if (halo) {
      halo.position.set(pull.current.x, pull.current.y, 0)
      ;(halo.material as SpriteMaterial).opacity = 0.55 * pull.current.strength
    }

    const group = groupRef.current
    if (group) {
      const tiltX = interactive && pointer.current.active ? -pointer.current.y * 0.06 : 0
      const tiltY = interactive && pointer.current.active ? pointer.current.x * 0.1 : 0
      group.rotation.x = MathUtils.damp(group.rotation.x, tiltX, 2, animate ? delta : 1)
      group.rotation.y = MathUtils.damp(group.rotation.y, tiltY, 2, animate ? delta : 1)
    }
  })

  return (
    <group ref={groupRef}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={linesRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={AdditiveBlending} />
      </lineSegments>

      <points frustumCulled={false}>
        <bufferGeometry ref={pointsRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={lowPower ? 0.2 : 0.17}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      <sprite ref={haloRef} scale={1.1}>
        <spriteMaterial map={texture} color={palette.node} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </sprite>
    </group>
  )
}

/** Decorative constellation behind the auth panel. Resources are disposed by R3F on unmount. */
export default function AuthScene({ onContextLost, ...props }: AuthSceneProps) {
  return (
    <Canvas
      frameloop={props.animate ? 'always' : 'demand'}
      dpr={props.lowPower ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}
      gl={{ antialias: !props.lowPower, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      tabIndex={-1}
    >
      <ContextLossListener onContextLost={onContextLost} />
      <Constellation {...props} />
    </Canvas>
  )
}
