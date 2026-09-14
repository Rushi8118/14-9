import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Subtle decorative Three.js particle field for admin dashboard chrome.
 *
 * Renders nothing (a static CSS gradient instead) when the visitor prefers
 * reduced motion or the device has no usable WebGL context, so this is a
 * pure enhancement layer — it never gates or delays real page content.
 */

type Variant = 'header' | 'empty' | 'pulse'

const PARTICLE_COUNT: Record<'header' | 'empty', number> = { header: 90, empty: 160 }

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

export function AdminAmbientScene({ variant = 'header', className }: { variant?: Variant; className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<'checking' | '3d' | 'fallback'>('checking')

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !supportsWebGL()) {
      setMode('fallback')
      return
    }
    setMode('3d')
  }, [])

  useEffect(() => {
    if (mode !== '3d') return
    const mount = mountRef.current
    const container = containerRef.current
    if (!mount || !container) return

    let cancelled = false
    let cleanup = () => {}

    import('three')
      .then((THREE) => {
        if (cancelled || !mount || !container) return

        const width = mount.clientWidth || 1
        const height = mount.clientHeight || 1

        let renderer: InstanceType<typeof THREE.WebGLRenderer>
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
        } catch {
          setMode('fallback')
          return
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 20)
        camera.position.z = variant === 'header' ? 5 : variant === 'pulse' ? 3.2 : 6.5

        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

        const disposables: { dispose: () => void }[] = []
        let mesh: InstanceType<typeof THREE.Object3D> | null = null

        if (variant === 'pulse') {
          // A tiny low-poly icosahedron standing in for "live activity" —
          // no particles, no post-processing, just one cheap mesh.
          const geometry = new THREE.IcosahedronGeometry(1, 0)
          const material = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.85 })
          const core = new THREE.Mesh(geometry, material)
          scene.add(core)
          disposables.push(geometry, material)
          mesh = core

          const glowGeometry = new THREE.IcosahedronGeometry(1.3, 0)
          const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.08 })
          const glow = new THREE.Mesh(glowGeometry, glowMaterial)
          scene.add(glow)
          disposables.push(glowGeometry, glowMaterial)
        } else {
          const count = PARTICLE_COUNT[variant]
          const positions = new Float32Array(count * 3)
          const spreadX = variant === 'header' ? 8 : 6
          const spreadY = variant === 'header' ? 2.6 : 4
          for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spreadX
            positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4
          }
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

          const material = new THREE.PointsMaterial({
            color: variant === 'header' ? 0xd4af37 : 0x60a5fa,
            size: variant === 'header' ? 0.045 : 0.06,
            transparent: true,
            opacity: variant === 'header' ? 0.45 : 0.35,
            sizeAttenuation: true,
          })
          const points = new THREE.Points(geometry, material)
          scene.add(points)
          disposables.push(geometry, material)
          mesh = points
        }

        let frameId = 0
        let isIntersecting = true
        const clock = new THREE.Clock()

        const animate = () => {
          if (!isIntersecting || document.hidden) {
            frameId = 0
            return
          }
          frameId = requestAnimationFrame(animate)
          const t = clock.getElapsedTime()
          if (variant === 'pulse' && mesh) {
            mesh.rotation.y = t * 0.4
            mesh.rotation.x = t * 0.25
            const pulse = 1 + Math.sin(t * 2) * 0.08
            mesh.scale.setScalar(pulse)
          } else if (mesh) {
            mesh.rotation.y = t * 0.02
            mesh.rotation.x = Math.sin(t * 0.05) * 0.05
          }
          renderer.render(scene, camera)
        }

        const observer = new IntersectionObserver(
          (entries) => {
            isIntersecting = entries[0]?.isIntersecting ?? true
            if (isIntersecting && !frameId) animate()
          },
          { threshold: 0.05 },
        )
        observer.observe(container)

        const handleVisibility = () => {
          if (!document.hidden && isIntersecting && !frameId) animate()
        }
        document.addEventListener('visibilitychange', handleVisibility)
        animate()

        const onResize = () => {
          if (!mount) return
          const w = mount.clientWidth || 1
          const h = mount.clientHeight || 1
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
        ro?.observe(mount)

        cleanup = () => {
          if (frameId) cancelAnimationFrame(frameId)
          observer.disconnect()
          document.removeEventListener('visibilitychange', handleVisibility)
          ro?.disconnect()
          disposables.forEach((d) => d.dispose())
          renderer.dispose()
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
      })
      .catch(() => {
        if (!cancelled) setMode('fallback')
      })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [mode, variant])

  if (variant === 'pulse') {
    // Small inline visual (not a full-bleed background) — a static pulsing
    // dot when 3D is unavailable, so "live" status is still legible.
    if (mode === 'fallback') {
      return (
        <div aria-hidden="true" className={cn('flex h-16 w-16 items-center justify-center', className)}>
          <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
        </div>
      )
    }
    return (
      <div ref={containerRef} aria-hidden="true" className={cn('pointer-events-none h-16 w-16 overflow-hidden', className)}>
        <div ref={mountRef} className="h-full w-full" />
      </div>
    )
  }

  if (mode === 'fallback') {
    return (
      <div
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-0', className)}
        style={{
          background:
            variant === 'header'
              ? 'radial-gradient(ellipse at top left, rgba(212,175,55,0.14), transparent 60%)'
              : 'radial-gradient(circle at center, rgba(96,165,250,0.12), transparent 65%)',
        }}
      />
    )
  }

  return (
    <div ref={containerRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div ref={mountRef} className="h-full w-full" />
    </div>
  )
}

export default AdminAmbientScene
