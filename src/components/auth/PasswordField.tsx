import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { AuthField, type AuthFieldProps } from './AuthField'

type PasswordFieldProps = Omit<AuthFieldProps, 'icon' | 'type' | 'trailing'>

/** Password input with an accessible show/hide toggle. The value is never logged or persisted. */
export function PasswordField({ id, label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      {...props}
      id={id}
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={`Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
    />
  )
}
