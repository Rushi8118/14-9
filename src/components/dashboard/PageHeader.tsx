import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="min-w-0">
        <h1 className="desk-display text-[26px] font-semibold leading-tight text-[var(--desk-navy)] sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-[var(--desk-muted)] sm:text-[15px]">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">{actions}</div>}
    </motion.header>
  )
}

/** Fades a dashboard section in; MotionConfig in the shell disables it for reduced motion. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
