export function AuthDivider({ label = 'Or continue with' }: { label?: string }) {
  return (
    <div className="relative my-6" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wider" aria-hidden="true">
        <span className="bg-card px-3 text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
