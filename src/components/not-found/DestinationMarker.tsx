import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { COLORS, GLOBE_RADIUS, latLngToVector3, type Destination } from './geo'
import { useGlowTexture } from './useGlowTexture'

/** A glowing pin on the globe surface with a slow pulsing ring. */
export function DestinationMarker({ destination, animate }: { destination: Destination; animate: boolean }) {
  const glow = useGlowTexture()
  const ring = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null)
  const isOrigin = destination.accent === 'gold'
  const color = isOrigin ? COLORS.gold : COLORS.cyan

  const { position, quaternion, phase } = useMemo(() => {
    const point = latLngToVector3(destination.lat, destination.lng, GLOBE_RADIUS * 1.008)
    // Orient the marker so its ring lies flat on the surface (local +Z = surface normal).
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), point.clone().normalize())
    const offset = (((destination.lat * 0.37 + destination.lng * 0.11) % 1) + 1) % 1
    return { position: point, quaternion: orientation, phase: offset }
  }, [destination.lat, destination.lng])

  useFrame((state) => {
    const mesh = ring.current
    if (!mesh) return
    const cycle = animate ? (state.clock.elapsedTime * 0.45 + phase) % 1 : 0.4
    mesh.scale.setScalar(1 + cycle * 1.8)
    mesh.material.opacity = (1 - cycle) * 0.65
  })

  return (
    <group position={position} quaternion={quaternion}>
      <mesh>
        <sphereGeometry args={[isOrigin ? 0.034 : 0.026, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={isOrigin ? 0.36 : 0.24}>
        <spriteMaterial
          map={glow}
          color={color}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh ref={ring}>
        <ringGeometry args={[0.05, 0.062, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
