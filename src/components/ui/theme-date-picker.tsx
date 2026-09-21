import * as React from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
  parseISO,
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ThemeDatePickerProps {
  id?: string
  value?: string // YYYY-MM-DD format
  onChange?: (dateString: string) => void
  minDate?: Date | string
  maxDate?: Date | string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  variant?: 'dashboard' | 'admin' | 'default'
  showShortcuts?: boolean
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function ThemeDatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date...',
  disabled = false,
  className,
  variant = 'dashboard',
  showShortcuts = true,
}: ThemeDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Selected date parsed as Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return null
    try {
      return parseISO(value)
    } catch {
      return null
    }
  }, [value])

  // Current month being viewed in the calendar
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) return selectedDate
    if (minDate) {
      const min = typeof minDate === 'string' ? parseISO(minDate) : minDate
      if (!isNaN(min.getTime()) && isBefore(new Date(), min)) return min
    }
    return new Date()
  })

  // Synchronize calendar view if selected date changes externally
  React.useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentMonth(selectedDate)
    }
  }, [selectedDate])

  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return null
    const d = typeof minDate === 'string' ? parseISO(minDate) : minDate
    return isNaN(d.getTime()) ? null : startOfDay(d)
  }, [minDate])

  const parsedMaxDate = React.useMemo(() => {
    if (!maxDate) return null
    const d = typeof maxDate === 'string' ? parseISO(maxDate) : maxDate
    return isNaN(d.getTime()) ? null : startOfDay(d)
  }, [maxDate])

  // Generate calendar day grid
  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd')
    onChange?.(formatted)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  const isDayDisabled = (day: Date) => {
    const dayStart = startOfDay(day)
    if (parsedMinDate && isBefore(dayStart, parsedMinDate)) return true
    if (parsedMaxDate && isBefore(parsedMaxDate, dayStart)) return true
    return false
  }

  // Quick shortcuts
  const shortcuts = React.useMemo(() => {
    const now = new Date()
    const tomorrow = addDays(now, 1)
    const nextWeek = addDays(now, 7)

    const list = [
      { label: 'Tomorrow', date: tomorrow },
      { label: 'In 3 Days', date: addDays(now, 3) },
      { label: 'Next Week', date: nextWeek },
    ]

    return list.filter((s) => !isDayDisabled(s.date))
  }, [parsedMinDate, parsedMaxDate])

  const isAdmin = variant === 'admin'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            'group relative flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-left text-sm font-semibold transition-all duration-200 outline-none',
            'focus-visible:ring-2 focus-visible:ring-offset-2',
            isAdmin
              ? 'border-[var(--desk-line)] bg-white/5 text-[var(--desk-navy)] hover:border-[var(--desk-gold)]/50 focus-visible:ring-[var(--desk-gold)] dark:bg-black/30 dark:text-slate-100'
              : 'border-border/60 bg-[var(--ud-canvas)]/25 text-[var(--ud-ink)] hover:border-[var(--ud-copper)]/50 hover:bg-[var(--ud-canvas)]/40 focus-visible:ring-[var(--ud-copper)]',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                isAdmin
                  ? 'bg-[var(--desk-gold)]/15 text-[var(--desk-gold)] dark:bg-[var(--desk-gold)]/20'
                  : 'bg-[var(--ud-copper)]/15 text-[var(--ud-copper)]',
              )}
            >
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            {selectedDate && !isNaN(selectedDate.getTime()) ? (
              <span className="font-semibold tracking-wide">
                {format(selectedDate, 'EEE, d MMM yyyy')}
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {selectedDate && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent)
                }}
                aria-label="Clear date"
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          'z-50 w-[310px] rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95',
          isAdmin
            ? 'border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)] dark:bg-[#0a0d14] dark:border-white/10 dark:text-slate-100'
            : 'border-border/70 bg-card text-[var(--ud-ink)] shadow-[0_12px_36px_-6px_rgba(196,154,43,0.12)]',
        )}
      >
        {/* Month & Year Navigation Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
            className="h-8 w-8 rounded-lg hover:bg-muted/70 text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h4 className="font-serif text-sm font-bold tracking-wide text-foreground flex items-center gap-1.5">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            className="h-8 w-8 rounded-lg hover:bg-muted/70 text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekdays Header */}
        <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/75"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1" role="grid">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const isTodayDate = isToday(day)
            const disabledDay = isDayDisabled(day)

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabledDay}
                onClick={() => handleSelectDay(day)}
                aria-pressed={isSelected}
                aria-label={format(day, 'EEEE, d MMMM yyyy')}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150',
                  // Disabled state
                  disabledDay && 'cursor-not-allowed opacity-25 text-muted-foreground',
                  // Outside month
                  !isCurrentMonth && !disabledDay && 'text-muted-foreground/45',
                  // Current month normal
                  isCurrentMonth && !disabledDay && !isSelected && 'text-foreground hover:scale-105',
                  // Hover styling
                  !disabledDay &&
                    !isSelected &&
                    (isAdmin
                      ? 'hover:bg-[var(--desk-gold)]/20 hover:text-[var(--desk-navy)] dark:hover:bg-[var(--desk-gold)]/25 dark:hover:text-amber-200'
                      : 'hover:bg-[var(--ud-copper)]/15 hover:text-[var(--ud-ink)]'),
                  // Today marker ring (when not selected)
                  isTodayDate &&
                    !isSelected &&
                    (isAdmin
                      ? 'ring-1.5 ring-[var(--desk-gold)] font-bold text-[var(--desk-gold)]'
                      : 'ring-1.5 ring-[var(--ud-copper)] font-bold text-[var(--ud-copper)]'),
                  // Selected state
                  isSelected &&
                    (isAdmin
                      ? 'bg-[var(--desk-gold)] text-[var(--desk-navy)] font-bold shadow-sm ring-2 ring-[var(--desk-gold)]/40 scale-105'
                      : 'bg-[var(--ud-ink)] text-white font-bold shadow-sm ring-2 ring-[var(--ud-copper)]/50 scale-105'),
                )}
              >
                <span>{format(day, 'd')}</span>
                {isTodayDate && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-80" />
                )}
              </button>
            )
          })}
        </div>

        {/* Quick select shortcuts */}
        {showShortcuts && shortcuts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Quick pick:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shortcuts.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSelectDay(s.date)}
                  className="rounded-lg border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
