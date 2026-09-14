let cachedSupport: boolean | null = null

/** Detects a usable WebGL context once, then releases it immediately. */
export function hasWebGL(): boolean {
  if (cachedSupport !== null) return cachedSupport
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    cachedSupport = Boolean(context)
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cachedSupport = false
  }
  return cachedSupport
}
