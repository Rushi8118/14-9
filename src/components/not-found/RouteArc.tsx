import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type { Line2, LineSegments2 } from 'three-stdlib'
import { GLOBE_RADIUS } from './geo'
import { useGlowTexture } from './useGlowTexture'

export type RouteArcProps = {
  from: THREE.Vector3
  to: THREE.Vector3
  color: string
  /** 0–1 start position of the traveller, so routes don't move in lockstep. */
  offset?: number
  /** Journeys per second. */
  speed?: number
  animate: boolean
}

/**
 * One journey: a faint arc over the globe, bright dashes flowing along it, and a glowing
 * traveller point that moves from origin to destination.
 */
export function RouteArc({ from, to, color, offset = 0, speed = 0.08, animate }: RouteArcProps) {
  const glow = useGlowTexture()
  const flowLine = useRef<Line2 | LineSegments2>(null)
  const traveller = useRef<THREE.Group>(null)
  const scratch = useMemo(() => new THREE.Vector3(), [])

  // Quadratic Bézier lifted off the surface: the control point sits above the midpoint,
  // higher for longer journeys (capped so arcs stay inside the frame).
  const { curve, points } = useMemo(() => {
    const distance = from.distanceTo(to)
    const midpoint = from.clone().add(to).multiplyScalar(0.5)
    if (midpoint.lengthSq() < 1e-6) midpoint.set(0, 1, 0)
    const control = midpoint.normalize().multiplyScalar(GLOBE_RADIUS + 0.2 + Math.min(distance * 0.38, 0.95))
    const arc = new THREE.QuadraticBezierCurve3(from, control, to)
    return { curve: arc, points: arc.getPoints(72) }
  }, [from, to])

  useFrame((state, delta) => {
    // Dash offset animation makes light appear to flow toward the destination.
    if (animate && flowLine.current) flowLine.current.material.dashOffset -= delta * 0.45

    const group = traveller.current
    if (!group) return
    const t = animate ? (state.clock.elapsedTime * speed + offset) % 1 : 0.55
    curve.getPointAt(t, scratch)
    group.position.copy(scratch)
    // Grow in at departure and fade out on arrival.
    group.scale.setScalar(0.35 + Math.sin(t * Math.PI) * 0.9)
  })

  return (
    <group>
      <Line points={points} color={color} lineWidth={1} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      <Line
        ref={flowLine}
        points={points}
        color={color}
        lineWidth={1.8}
        dashed
        dashScale={1}
        dashSize={0.16}
        gapSize={0.3}
        transparent
        opacity={0.75}
        depthWrite={false}
        toneMapped={false}
      />
      <group ref={traveller}>
        <mesh>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <sprite scale={0.22}>
          <spriteMaterial
            map={glow}
            color={color}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      </group>
    </group>
  )
}
