import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, FileText, Flame, Loader2, User as UserIcon } from 'lucide-react'
import { SearchBar } from '@/components/admin/SearchBar'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase/client'

type SearchResult = {
  id: string
  type: 'user' | 'blog' | 'urgent_requirement' | 'application'
  label: string
  sublabel?: string
  path: string
}

const TYPE_ICON: Record<SearchResult['type'], React.ComponentType<{ className?: string }>> = {
  user: UserIcon,
  blog: FileText,
  urgent_requirement: Flame,
  application: Briefcase,
}

/** Lightweight cross-entity search across users, blog posts, urgent
 *  requirements, and applications — enough for an admin to jump straight to
 *  a record instead of navigating page by page. */
export function AdminGlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const [users, posts, urgents, apps] = await Promise.all([
          supabase.from('user_profiles').select('id,full_name,email').or(`full_name.ilike.%${term}%,email.ilike.%${term}%`).limit(4),
          supabase.from('blog_posts').select('id,title,slug').ilike('title', `%${term}%`).limit(4),
          supabase.from('urgent_requirements').select('id,title,slug').ilike('title', `%${term}%`).limit(4),
          supabase.from('applications').select('id,application_id,application_type').ilike('application_id', `%${term}%`).limit(4),
        ])

        const next: SearchResult[] = [
          ...(users.data || []).map((u) => ({ id: u.id, type: 'user' as const, label: u.full_name || u.email, sublabel: u.email, path: `/admin/users/${u.id}` })),
          ...(posts.data || []).map((p) => ({ id: p.id, type: 'blog' as const, label: p.title, sublabel: `/blog/${p.slug}`, path: '/admin/blog' })),
          ...(urgents.data || []).map((r) => ({ id: r.id, type: 'urgent_requirement' as const, label: r.title, sublabel: `/urgent-requirements/${r.slug}`, path: '/admin/urgent-requirements' })),
          ...(apps.data || []).map((a) => ({ id: a.id, type: 'application' as const, label: a.application_id || a.id, sublabel: a.application_type, path: '/admin/applications' })),
        ]
        setResults(next)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  const go = (result: SearchResult) => {
    navigate(result.path)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open && query.trim().length >= 2} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div>
          <SearchBar
            value={query}
            onChange={(value) => {
              setQuery(value)
              setOpen(true)
            }}
            placeholder="Search users, blog, applications…"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[22rem] p-1.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
        ) : (
          <ul className="max-h-80 space-y-0.5 overflow-y-auto">
            {results.map((result) => {
              const Icon = TYPE_ICON[result.type]
              return (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => go(result)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{result.label}</span>
                      {result.sublabel && <span className="block truncate text-xs text-muted-foreground">{result.sublabel}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
