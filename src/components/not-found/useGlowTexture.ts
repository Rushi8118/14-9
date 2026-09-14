import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/**
 * A tiny radial-gradient texture drawn on a canvas at runtime. It turns square points and
 * sprites into soft glowing dots, giving a bloom-like look without a post-processing pass.
 */
export function useGlowTexture(size = 64) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.22, 'rgba(255,255,255,0.85)')
      gradient.addColorStop(0.55, 'rgba(255,255,255,0.18)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, size, size)
    }
    const canvasTexture = new THREE.CanvasTexture(canvas)
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    return canvasTexture
  }, [size])

  useEffect(() => () => texture.dispose(), [texture])

  return texture
}
