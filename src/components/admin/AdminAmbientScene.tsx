import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Subtle decorative Three.js particle field for admin dashboard chrome.
 *
 * Renders nothing (a static CSS gradient instead) when the visitor prefers
 * reduced motion or the device has no usable WebGL context, so this is a
 * pure enhancement layer — it never gates or delays real page content.
 */

type Variant = 'header' | 'empty'

const PARTICLE_COUNT: Record<Variant, number> = { header: 90, empty: 160 }

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
        camera.position.z = variant === 'header' ? 5 : 6.5

        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

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
          points.rotation.y = t * 0.02
          points.rotation.x = Math.sin(t * 0.05) * 0.05
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
          geometry.dispose()
          material.dispose()
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
