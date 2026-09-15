import { Check, X } from "lucide-react"
import type { PasswordStrength } from "@/lib/validations/auth"

const REQUIREMENTS = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUpper", label: "At least 1 uppercase letter" },
  { key: "hasLower", label: "At least 1 lowercase letter" },
  { key: "hasNumber", label: "At least 1 number" },
  { key: "hasSpecial", label: "At least 1 special character" },
] as const

export function PasswordRequirements({ strength }: { strength: PasswordStrength }) {
  return (
    <ul className="mt-2 space-y-1 rounded-lg border border-border/40 bg-muted/20 p-2.5">
      {REQUIREMENTS.map(({ key, label }) => {
        const passed = strength.checks[key]
        return (
          <li
            key={key}
            className={`flex items-center gap-2 text-[11px] leading-tight sm:text-xs ${
              passed ? "font-medium text-emerald-600" : "text-muted-foreground"
            }`}
          >
            <span
              className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                passed ? "bg-emerald-500/15" : "bg-muted"
              }`}
              aria-hidden="true"
            >
              {passed ? (
                <Check className="h-2 w-2 text-emerald-600" strokeWidth={3} />
              ) : (
                <X className="h-2 w-2 text-muted-foreground/70" strokeWidth={2.5} />
              )}
            </span>
            <span>{label}</span>
            <span className="sr-only">{passed ? "(met)" : "(not met)"}</span>
          </li>
        )
      })}
    </ul>
  )
}
