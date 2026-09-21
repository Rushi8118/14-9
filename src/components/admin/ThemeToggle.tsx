import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    localStorage.setItem('admin-theme', next)
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative flex h-10 items-center gap-2 rounded-full border border-[#C49A2B]/25 bg-[var(--desk-surface)]/90 px-2.5 sm:px-3 text-xs font-semibold text-[var(--desk-navy)] shadow-2xs transition-all duration-200 hover:border-[#C49A2B]/50 hover:bg-[#C49A2B]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2 select-none cursor-pointer"
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--desk-gold)]/15 transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-[#e5b84c] fill-[#e5b84c] transition-all" aria-hidden="true" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-400 transition-all" aria-hidden="true" />
        )}
      </span>
      <span className="hidden sm:inline-flex items-center gap-1.5 font-medium tracking-wide">
        <span className="text-[11px] uppercase tracking-wider text-[var(--desk-muted)]">Theme</span>
        <span className="font-semibold text-[var(--desk-navy)] capitalize">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </span>
    </button>
  )
}
