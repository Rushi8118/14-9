import React, { useState, useEffect, useRef, useMemo, useId } from "react"
import { ChevronDown, Search, Check } from "lucide-react"
import { getCountries, getCountryCallingCode } from "react-phone-number-input/input"
import type { Country } from "react-phone-number-input"
import en from "react-phone-number-input/locale/en"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import "flag-icons/css/flag-icons.min.css"

export interface PhoneInputFieldProps {
  id?: string
  name?: string
  value?: string
  onChange?: (value: string | undefined) => void
  defaultCountry?: Country
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  icon?: React.ReactNode
  autoFocus?: boolean
  hideHint?: boolean
}

function getFlagEmoji(countryCode: string): string {
  try {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
  } catch {
    return "🌐"
  }
}

// Popular visa destination countries displayed at the top of the list. They also
// win when several countries share a calling code (+1 → United States, +44 → UK).
const PRIORITY_COUNTRIES: Country[] = [
  "IN", // India
  "GB", // United Kingdom
  "CA", // Canada
  "AU", // Australia
  "JP", // Japan
  "DE", // Germany
  "US", // United States
  "AE", // UAE / Dubai
  "SG", // Singapore
  "NZ", // New Zealand
  "FR", // France
  "IE", // Ireland
]

/** Preferred country when a calling code is shared by several countries. */
const PREFERRED_FOR_CODE: Record<string, Country> = {
  "1": "US",
  "7": "RU",
  "44": "GB",
  "61": "AU",
  "39": "IT",
  "47": "NO",
  "212": "MA",
  "262": "RE",
  "290": "SH",
  "358": "FI",
  "590": "GP",
  "599": "CW",
}

/** Mobile number length (without country code) for common destinations; others allow up to 15 digits. */
const NATIONAL_NUMBER_LENGTH: Partial<Record<Country, { min: number; max: number }>> = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9, max: 9 },
  NZ: { min: 8, max: 10 },
  AE: { min: 9, max: 9 },
  SA: { min: 9, max: 9 },
  QA: { min: 8, max: 8 },
  SG: { min: 8, max: 8 },
  MY: { min: 9, max: 10 },
  JP: { min: 10, max: 10 },
  DE: { min: 10, max: 11 },
  FR: { min: 9, max: 9 },
  IE: { min: 9, max: 9 },
  IT: { min: 9, max: 10 },
  ES: { min: 9, max: 9 },
  NL: { min: 9, max: 9 },
  PL: { min: 9, max: 9 },
  RU: { min: 10, max: 10 },
  NP: { min: 10, max: 10 },
  BD: { min: 10, max: 10 },
  LK: { min: 9, max: 9 },
  PK: { min: 10, max: 10 },
}

const DEFAULT_LENGTH = { min: 6, max: 15 }

export function getNationalNumberLength(country: Country) {
  return NATIONAL_NUMBER_LENGTH[country] ?? DEFAULT_LENGTH
}

function safeCallingCode(country: Country): string {
  try {
    return getCountryCallingCode(country)
  } catch {
    return ""
  }
}

/**
 * True when `value` is "+<country code><number>" with a known country code and a
 * number length that fits that country (e.g. exactly 10 digits for India).
 */
export function isValidPhoneNumber(value: string | null | undefined): boolean {
  if (!value || !value.startsWith("+")) return false
  const all = value.slice(1).replace(/\D/g, "")
  for (let len = 3; len >= 1; len--) {
    const code = all.slice(0, len)
    const country =
      PREFERRED_FOR_CODE[code] ?? getCountries().find((c) => safeCallingCode(c) === code)
    if (country) {
      const national = all.slice(len)
      const { min, max } = getNationalNumberLength(country)
      return national.length >= min && national.length <= max
    }
  }
  return false
}

export function PhoneInputField({
  id,
  name,
  value = "",
  onChange,
  defaultCountry = "IN",
  placeholder,
  disabled = false,
  required = false,
  className = "",
  icon,
  autoFocus,
  hideHint = false,
}: PhoneInputFieldProps) {
  const autoId = useId()
  const numberId = id ?? `${autoId}-number`
  const codeId = `${autoId}-code`
  const hintId = `${autoId}-hint`

  const initialCallingCode = useMemo(() => safeCallingCode(defaultCountry), [defaultCountry])
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry)
  // Prefill with default country calling code (e.g. "91" for India)
  const [codeInput, setCodeInput] = useState(initialCallingCode)
  const [localNumber, setLocalNumber] = useState("")
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [touched, setTouched] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const lastEmitted = useRef<string | undefined>(undefined)

  // Build full country list with localized names and dial codes
  const countryList = useMemo(() => {
    return getCountries()
      .map((code) => ({
        code,
        name: en[code] || code,
        callingCode: safeCallingCode(code),
        flag: getFlagEmoji(code),
      }))
      .filter((c) => c.callingCode)
      .sort((a, b) => {
        const aPri = PRIORITY_COUNTRIES.indexOf(a.code)
        const bPri = PRIORITY_COUNTRIES.indexOf(b.code)
        if (aPri !== -1 && bPri !== -1) return aPri - bPri
        if (aPri !== -1) return -1
        if (bPri !== -1) return 1
        return a.name.localeCompare(b.name)
      })
  }, [])

  const callingCodes = useMemo(() => new Set(countryList.map((c) => c.callingCode)), [countryList])

  /** Country for an exact calling code, preferring priority/main countries for shared codes. */
  const countryForCode = useMemo(() => {
    const map = new Map<string, Country>()
    for (const c of countryList) {
      if (!map.has(c.callingCode)) map.set(c.callingCode, c.code)
    }
    for (const [code, country] of Object.entries(PREFERRED_FOR_CODE)) {
      if (map.has(code)) map.set(code, country)
    }
    return map
  }, [countryList])

  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return countryList
    const digits = q.replace(/\D/g, "")
    return countryList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (digits && c.callingCode.startsWith(digits)) ||
        c.code.toLowerCase() === q
    )
  }, [countryList, searchQuery])

  const detectedCountry = countryForCode.get(codeInput) ?? null
  const currentCallingCode = detectedCountry ? codeInput : ""
  const length = getNationalNumberLength(detectedCountry ?? selectedCountry)
  const digits = localNumber.replace(/\D/g, "")

  const emit = (callingCode: string, nationalDigits: string) => {
    const next = callingCode && nationalDigits ? `+${callingCode}${nationalDigits}` : undefined
    lastEmitted.current = next
    onChange?.(next)
  }

  // Parse initial or external `value` prop (skip values this component just emitted)
  useEffect(() => {
    if (value === (lastEmitted.current ?? "")) return
    if (!value) {
      setLocalNumber("")
      return
    }
    const clean = value.replace(/[^\d+]/g, "")
    if (clean.startsWith("+")) {
      const all = clean.slice(1)
      for (let len = 3; len >= 1; len--) {
        const code = all.slice(0, len)
        const country = countryForCode.get(code)
        if (country) {
          setCodeInput(code)
          setSelectedCountry(country)
          setLocalNumber(all.slice(len))
          return
        }
      }
      setLocalNumber(all)
    } else {
      setLocalNumber(clean)
    }
  }, [value, countryForCode])

  /** Split a pasted "+<code><number>" into its parts. */
  const applyFullNumber = (raw: string): boolean => {
    const clean = raw.replace(/[^\d+]/g, "")
    if (!clean.startsWith("+")) return false
    const all = clean.slice(1)
    for (let len = 3; len >= 1; len--) {
      const code = all.slice(0, len)
      const country = countryForCode.get(code)
      if (country) {
        const national = all.slice(len).slice(0, getNationalNumberLength(country).max)
        setCodeInput(code)
        setSelectedCountry(country)
        setLocalNumber(national)
        emit(code, national)
        numberInputRef.current?.focus()
        return true
      }
    }
    return false
  }

  // ---- Country code box ----
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.includes("+") && raw.replace(/\D/g, "").length > 4 && applyFullNumber(raw)) return

    const typed = raw.replace(/\D/g, "")
    const couldGrow = (value: string) => [...callingCodes].some((c) => c.startsWith(value))

    // Digits typed past a complete country code (e.g. "91" then "98765…") belong to
    // the number: keep the longest valid code and move the rest into the number box.
    if (typed && !countryForCode.has(typed) && !couldGrow(typed)) {
      for (let len = Math.min(3, typed.length - 1); len >= 1; len--) {
        const prefix = typed.slice(0, len)
        const prefixCountry = countryForCode.get(prefix)
        if (prefixCountry) {
          const national = (typed.slice(len) + digits).slice(0, getNationalNumberLength(prefixCountry).max)
          setCodeInput(prefix)
          setSelectedCountry(prefixCountry)
          setLocalNumber(national)
          emit(prefix, national)
          numberInputRef.current?.focus()
          return
        }
      }
    }

    const code = typed.slice(0, 4)
    setCodeInput(code)
    const country = countryForCode.get(code)
    if (country) {
      setSelectedCountry(country)
      const trimmed = digits.slice(0, getNationalNumberLength(country).max)
      if (trimmed !== digits) setLocalNumber(trimmed)
      emit(code, trimmed)
      // Jump to the number once no longer calling code could still be typed.
      const longerPossible = [...callingCodes].some((c) => c.length > code.length && c.startsWith(code))
      if (!longerPossible) numberInputRef.current?.focus()
    } else {
      emit("", digits)
    }
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "ArrowRight") && detectedCountry) {
      const input = e.currentTarget
      if (e.key === "Enter" || input.selectionStart === input.value.length) {
        e.preventDefault()
        numberInputRef.current?.focus()
      }
    }
  }

  // ---- National number box ----
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.trim().startsWith("+") && applyFullNumber(raw)) return

    const next = raw.replace(/\D/g, "").slice(0, length.max)
    setLocalNumber(next)
    emit(currentCallingCode, next)
  }

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0
    if ((e.key === "Backspace" && !input.value) || (e.key === "ArrowLeft" && atStart)) {
      e.preventDefault()
      const code = codeInputRef.current
      code?.focus()
      if (code) code.setSelectionRange(code.value.length, code.value.length)
    }
  }

  // Handle country selection from the list
  const handleSelectCountry = (country: Country) => {
    const code = safeCallingCode(country)
    setSelectedCountry(country)
    setCodeInput(code)
    setOpen(false)
    setSearchQuery("")
    const trimmed = digits.slice(0, getNationalNumberLength(country).max)
    setLocalNumber(trimmed)
    emit(code, trimmed)
    setTimeout(() => numberInputRef.current?.focus(), 60)
  }

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearchQuery("")
    }
  }, [open])

  const combinedValue = currentCallingCode && digits ? `+${currentCallingCode}${digits}` : ""
  const displayCountry = detectedCountry ?? selectedCountry
  const countryName = detectedCountry ? en[detectedCountry] || detectedCountry : null

  const defaultPlaceholder =
    length.min === length.max ? `${length.max}-digit number` : `${length.min}–${length.max} digit number`

  let hint: { text: string; tone: "muted" | "error" | "ok" }
  if (!codeInput) hint = { text: "Enter the country code first, e.g. 91 for India", tone: touched ? "error" : "muted" }
  else if (!detectedCountry && [...callingCodes].some((c) => c.startsWith(codeInput)))
    hint = { text: `Keep typing the country code…`, tone: touched ? "error" : "muted" }
  else if (!detectedCountry) hint = { text: `+${codeInput} is not a valid country code`, tone: "error" }
  else if (!digits) hint = { text: `${countryName} · enter ${defaultPlaceholder}`, tone: "muted" }
  else if (digits.length < length.min)
    hint = { text: `${countryName} · ${digits.length}/${length.max} digits`, tone: touched ? "error" : "muted" }
  else hint = { text: `${countryName} · ${digits.length}/${length.max} digits`, tone: "ok" }

  const invalid = touched && (!detectedCountry || (digits.length > 0 && digits.length < length.min))

  // Separate height and font-size classes intended for the input control from outer wrapper classes
  const classes = (className || "").split(/\s+/).filter(Boolean)
  const heightClass = classes.find((c) => /^h-\S+/.test(c)) || "h-10"
  const textSizeClass = classes.find((c) => /^text-(xs|sm|base|lg)/.test(c)) || "text-sm"
  const outerClasses = classes.filter((c) => !/^h-\S+/.test(c) && !/^text-(xs|sm|base|lg)/.test(c)).join(" ")

  const showHelper = !hideHint || (invalid && touched)

  return (
    <div className={`w-full ${outerClasses}`}>
      <div
        className={`relative flex w-full items-center rounded-md border bg-background/50 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 ${heightClass} ${
          invalid ? "border-destructive" : "border-border/70"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {/* Hidden input for standard native form submits */}
        {name && <input type="hidden" name={name} value={combinedValue} />}

        {/* Optional Leading Icon (e.g. Phone or WhatsApp) */}
        {icon && <div className="pointer-events-none shrink-0 pl-3 text-muted-foreground">{icon}</div>}

        {/* Flag: auto-detected from the code, also opens a searchable country list */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <button
              type="button"
              className={`flex h-full shrink-0 select-none items-center gap-1 rounded-l-md pl-2.5 pr-1.5 ${textSizeClass} transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              title={countryName ? `${countryName} (change country)` : "Choose country"}
              aria-label={countryName ? `Country: ${countryName}. Change country` : "Choose country"}
            >
              {detectedCountry ? (
                <span
                  className={`fi fi-${displayCountry.toLowerCase()} rounded-[2px] text-[15px] leading-none`}
                  aria-hidden="true"
                />
              ) : (
                <span className="leading-none" aria-hidden="true">🌐</span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" aria-hidden="true" />
            </button>
          </PopoverTrigger>

          {/* Searchable Country Code Dropdown */}
          <PopoverContent
            align="start"
            sideOffset={6}
            className="z-[9999] w-72 rounded-xl border border-border/70 bg-card p-0 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 p-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                aria-label="Search country or code"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="scrollbar-thin max-h-60 overflow-y-auto p-1.5">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">No countries found</div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === detectedCountry
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c.code)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        isSelected ? "bg-primary/15 font-semibold text-primary" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`fi fi-${c.code.toLowerCase()} shrink-0 rounded-[2px] text-sm`} aria-hidden="true" />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 pl-2">
                        <span className="font-mono text-[11px] text-muted-foreground">+{c.callingCode}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Step 1: country code (typed) */}
        <div className="flex h-full shrink-0 items-center border-r border-border/60 pr-2">
          <span className={`font-mono ${textSizeClass} font-semibold text-muted-foreground`} aria-hidden="true">
            +
          </span>
          <input
            ref={codeInputRef}
            id={codeId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-country-code"
            aria-label="Country code"
            aria-describedby={hintId}
            aria-invalid={Boolean(codeInput) && !detectedCountry}
            placeholder="91"
            value={codeInput}
            onChange={handleCodeChange}
            onKeyDown={handleCodeKeyDown}
            disabled={disabled}
            autoFocus={autoFocus && !codeInput}
            maxLength={5}
            className={`h-full w-10 bg-transparent font-mono ${textSizeClass} font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed`}
          />
        </div>

        {/* Step 2: national number */}
        <input
          ref={numberInputRef}
          id={numberId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-describedby={hintId}
          aria-invalid={invalid}
          placeholder={placeholder && length.max === 10 && displayCountry === "IN" ? placeholder : defaultPlaceholder}
          value={localNumber}
          onChange={handleNumberChange}
          onKeyDown={handleNumberKeyDown}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus && Boolean(codeInput)}
          maxLength={length.max}
          className={`h-full w-full min-w-0 bg-transparent px-3 py-2 font-mono ${textSizeClass} tracking-wide text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed`}
        />
      </div>

      {showHelper && hint.text && (
        <p
          id={hintId}
          aria-live="polite"
          className={`mt-1 text-[11px] leading-tight ${
            hint.tone === "error" ? "text-destructive" : hint.tone === "ok" ? "text-emerald-600" : "text-muted-foreground"
          }`}
        >
          {hint.text}
        </p>
      )}
    </div>
  )
}

export default PhoneInputField
