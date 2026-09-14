import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Eye, FileText, Globe2, Loader2, Lock, Pencil, Plus,
  RefreshCw, Search, Trash2, Upload, X,
} from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { AiBlogWriter } from '@/components/admin/blog/AiBlogWriter'
import { BlogContent } from '@/components/blog/BlogContent'
import { SeoPanel } from '@/components/admin/SeoPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAdminBlogPosts } from '@/hooks/useAdminBlogPosts'
import { useAdminUrgentRequirements } from '@/hooks/useUrgentRequirements'
import { regenerateBlogSection, type GeneratedBlogPost, type RegenerableSection } from '@/lib/ai/blog-generator'
import { useAdminAiSettings } from '@/hooks/useAdminAiSettings'
import { sanitizeRichText } from '@/lib/security/sanitizeHtml'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type EditorState = GeneratedBlogPost & { id?: string }

const SECTION_LABELS: Record<RegenerableSection, string> = {
  content: 'Article body',
  faq: 'FAQ',
  meta: 'SEO title/description/excerpt',
  keywords: 'Keywords',
}

export default function AdminBlogPage() {
  const { posts, isLoading, saveGenerated, saving, setStatus, remove } = useAdminBlogPosts()
  const { requirements: urgentRequirements } = useAdminUrgentRequirements()
  const { settings } = useAdminAiSettings()
  const [search, setSearch] = useState('')
  const [showWriter, setShowWriter] = useState(false)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [dirty, setDirty] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [regenerating, setRegenerating] = useState<RegenerableSection | null>(null)
  const [savingStatus, setSavingStatus] = useState<'draft' | 'review' | 'published' | null>(null)

  useEffect(() => setDirty(false), [editor?.id])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [posts, search])

  const existingSlugs = useMemo(() => posts.map((p) => p.slug), [posts])
  const existingTitles = useMemo(() => posts.map((p) => p.title), [posts])
  const existingPostsForLinks = useMemo(() => posts.map((p) => ({ title: p.title, slug: p.slug })), [posts])
  const liveUrgentRequirements = useMemo(
    () => urgentRequirements.map((r) => ({ title: r.title, slug: r.slug })),
    [urgentRequirements],
  )

  const openEditor = (draft: GeneratedBlogPost, id?: string) => {
    setEditor({ ...draft, id })
    setShowWriter(false)
    setDirty(false)
  }

  const updateEditor = (patch: Partial<EditorState>) => {
    setEditor((current) => (current ? { ...current, ...patch } : current))
    setDirty(true)
  }

  const requestClose = () => {
    if (dirty) setCloseConfirmOpen(true)
    else setEditor(null)
  }

  const handleSave = async (status: 'draft' | 'review' | 'published') => {
    if (!editor) return
    if (!editor.title.trim()) { toast.error('Title is required.'); return }
    if (!editor.slug.trim()) { toast.error('Slug is required.'); return }
    if (!editor.content.trim() || editor.content.trim().length < 50) {
      toast.error('Content is too short to save.')
      return
    }
    if (savingStatus) return // duplicate-submit guard
    setSavingStatus(status)
    try {
      const saved = await saveGenerated({
        draft: { ...editor, content: sanitizeRichText(editor.content) },
        status,
        id: editor.id,
      })
      setEditor({ ...editor, id: saved.id, slug: saved.slug })
      setDirty(false)
      setPublishConfirmOpen(false)
    } finally {
      setSavingStatus(null)
    }
  }

  const handleRegenerate = async (section: RegenerableSection) => {
    if (!editor || regenerating) return
    setRegenerating(section)
    try {
      const patch = await regenerateBlogSection(settings, section, editor, settings.websiteContext)
      updateEditor(patch)
      toast.success(`${SECTION_LABELS[section]} regenerated — review before saving.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Regeneration failed')
    } finally {
      setRegenerating(null)
    }
  }

  const chipsField = (
    label: string,
    values: string[],
    onChange: (next: string[]) => void,
    placeholder: string,
  ) => (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-input bg-background p-2">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} aria-label={`Remove ${v}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 border-none bg-transparent text-xs outline-none"
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ',') return
            e.preventDefault()
            const value = e.currentTarget.value.trim()
            if (value && !values.includes(value)) onChange([...values, value])
            e.currentTarget.value = ''
          }}
        />
      </div>
    </Field>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileText className="h-6 w-6 text-primary" />
            Blog Posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-written, SEO-optimized articles — private drafts or public publish.
          </p>
        </div>
        <PermissionGuard permission="blogs.create">
          <Button className="gap-1.5" onClick={() => setShowWriter((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showWriter ? 'Hide AI writer' : 'Write with AI'}
          </Button>
        </PermissionGuard>
      </div>

      {showWriter && (
        <AiBlogWriter
          onGenerated={(draft) => openEditor(draft)}
          existingPosts={existingPostsForLinks}
          urgentRequirements={liveUrgentRequirements}
        />
      )}

      {editor && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Pencil className="h-4 w-4" />
              Review & edit before publish
              {editor.ai_generated && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  AI draft
                </span>
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={Boolean(savingStatus)} onClick={() => void handleSave('draft')}>
                <Lock className="mr-1 h-4 w-4" />
                Save private draft
              </Button>
              <PermissionGuard permission="blogs.publish">
                <Button disabled={Boolean(savingStatus)} onClick={() => setPublishConfirmOpen(true)}>
                  {savingStatus === 'published' ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1 h-4 w-4" />
                  )}
                  Publish public
                </Button>
              </PermissionGuard>
              <Button variant="ghost" onClick={requestClose}>
                Close
              </Button>
            </div>
          </div>

          {editor.flaggedClaims.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Guaranteed-outcome language was found and neutralized</p>
                <p className="mt-1 text-xs">
                  Detected: {editor.flaggedClaims.join(', ')}. The text has been rewritten to avoid promising a
                  guaranteed visa/job/approval — please review the content before publishing.
                </p>
              </div>
            </div>
          )}

          {editor.adminInputRequired.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Admin input required</p>
              <p className="mt-1 text-xs">
                The AI could not confidently fill: {editor.adminInputRequired.join(', ')}. Fill these in before publishing.
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <Input value={editor.title} onChange={(e) => updateEditor({ title: e.target.value })} />
                </Field>
                <Field label="Slug">
                  <Input value={editor.slug} onChange={(e) => updateEditor({ slug: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Meta title (SEO)">
                  <Input value={editor.meta_title} onChange={(e) => updateEditor({ meta_title: e.target.value.slice(0, 60) })} />
                </Field>
                <Field label="Search intent">
                  <select
                    value={editor.search_intent}
                    onChange={(e) => updateEditor({ search_intent: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="informational">Informational</option>
                    <option value="navigational">Navigational</option>
                    <option value="transactional">Transactional</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </Field>
              </div>
              <Field label="Excerpt">
                <textarea
                  value={editor.excerpt}
                  onChange={(e) => updateEditor({ excerpt: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Meta description">
                <textarea
                  value={editor.meta_desc}
                  onChange={(e) => updateEditor({ meta_desc: e.target.value.slice(0, 160) })}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{editor.meta_desc.length}/160</p>
              </Field>

              <Field label="Focus keyword">
                <Input value={editor.focus_keyword} onChange={(e) => updateEditor({ focus_keyword: e.target.value })} />
              </Field>
              {chipsField('Related keywords (AI suggestions)', editor.related_keywords, (v) => updateEditor({ related_keywords: v }), 'Add and press Enter…')}
              {chipsField('Long-tail keywords (AI suggestions)', editor.long_tail_keywords, (v) => updateEditor({ long_tail_keywords: v }), 'Add and press Enter…')}
              {chipsField('Tags', editor.tags, (v) => updateEditor({ tags: v }), 'Add and press Enter…')}

              <Field label="Image alt text">
                <Input value={editor.image_alt} onChange={(e) => updateEditor({ image_alt: e.target.value })} placeholder="Describe the cover image for accessibility & image search" />
              </Field>
              <Field label="Image caption (optional)">
                <Input value={editor.image_caption} onChange={(e) => updateEditor({ image_caption: e.target.value })} />
              </Field>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Article body (HTML, editable)
                </label>
                <Button
                  type="button" size="sm" variant="ghost"
                  disabled={regenerating !== null}
                  onClick={() => void handleRegenerate('content')}
                >
                  <RefreshCw className={`mr-1 h-3.5 w-3.5 ${regenerating === 'content' ? 'animate-spin' : ''}`} />
                  Regenerate body
                </Button>
              </div>
              <textarea
                value={editor.content}
                onChange={(e) => updateEditor({ content: e.target.value })}
                rows={18}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Est. reading time: {editor.reading_time_minutes || 1} min (recalculated on save)
              </p>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">FAQ</label>
                <Button type="button" size="sm" variant="ghost" disabled={regenerating !== null} onClick={() => void handleRegenerate('faq')}>
                  <RefreshCw className={`mr-1 h-3.5 w-3.5 ${regenerating === 'faq' ? 'animate-spin' : ''}`} />
                  Regenerate FAQ
                </Button>
              </div>
              <div className="space-y-2">
                {editor.faq.map((item, i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={item.question}
                        onChange={(e) => {
                          const next = [...editor.faq]
                          next[i] = { ...next[i], question: e.target.value }
                          updateEditor({ faq: next })
                        }}
                        className="w-full border-none bg-transparent text-sm font-medium outline-none"
                        placeholder="Question"
                      />
                      <button type="button" onClick={() => updateEditor({ faq: editor.faq.filter((_, idx) => idx !== i) })} aria-label="Remove FAQ item">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const next = [...editor.faq]
                        next[i] = { ...next[i], answer: e.target.value }
                        updateEditor({ faq: next })
                      }}
                      rows={2}
                      className="mt-1 w-full border-none bg-transparent text-sm text-muted-foreground outline-none"
                      placeholder="Answer"
                    />
                  </div>
                ))}
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={() => updateEditor({ faq: [...editor.faq, { question: '', answer: '' }] })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add FAQ item
                </Button>
              </div>

              <Field label="Disclaimer">
                <textarea
                  value={editor.disclaimer}
                  onChange={(e) => updateEditor({ disclaimer: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>

              {(editor.internal_links.length > 0 || editor.related_urgent_requirements.length > 0) && (
                <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
                  {editor.internal_links.length > 0 && (
                    <p><strong className="text-foreground">Internal link suggestions:</strong> {editor.internal_links.join(', ')}</p>
                  )}
                  {editor.related_urgent_requirements.length > 0 && (
                    <p className="mt-1"><strong className="text-foreground">Related urgent requirements:</strong> {editor.related_urgent_requirements.join(', ')}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SeoPanel
                pathPrefix="/blog"
                title={editor.title}
                metaTitle={editor.meta_title}
                metaDescription={editor.meta_desc}
                slug={editor.slug}
                focusKeyword={editor.focus_keyword}
                content={editor.content}
                faqCount={editor.faq.length}
                imageAlt={editor.image_alt}
                existingSlugs={existingSlugs}
                existingTitles={existingTitles}
                currentSlug={editor.slug}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Live preview
            </p>
            <h3 className="text-2xl font-bold text-foreground">{editor.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{editor.excerpt}</p>
            <div className="mt-6">
              <BlogContent html={editor.content} />
            </div>
            {editor.faq.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">Frequently asked questions</p>
                {editor.faq.map((item, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{item.question}</p>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
            {editor.disclaimer && (
              <p className="mt-6 border-t border-border pt-4 text-xs italic text-muted-foreground">{editor.disclaimer}</p>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>This draft has unsaved edits. Closing now will lose them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setCloseConfirmOpen(false); setEditor(null) }}>Discard and close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this post publicly?</AlertDialogTitle>
            <AlertDialogDescription>
              It will become visible to everyone at /blog/{editor?.slug}. Make sure you've reviewed the content,
              facts, and any admin-input-required fields above.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSave('published')} disabled={Boolean(savingStatus)}>
              {savingStatus === 'published' ? 'Publishing…' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts by title, slug, status…"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No blog posts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use “Write with AI” to generate your first SEO article.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((post) => {
              const isPublic = post.status === 'published'
              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">{post.title}</h3>
                      <StatusPill status={post.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /blog/{post.slug} · {post.category} · updated{' '}
                      {post.updated_at
                        ? formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPublic && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/blog/${post.slug}`} target="_blank">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    )}
                    <PermissionGuard permission="blogs.update">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openEditor(
                            {
                              title: post.title,
                              slug: post.slug,
                              excerpt: post.excerpt || '',
                              content: post.content,
                              category: post.category as GeneratedBlogPost['category'],
                              tags: post.tags || [],
                              meta_title: post.meta_title || post.title,
                              meta_desc: post.meta_desc || '',
                              keywords: post.keywords || [],
                              canonical_path: `/blog/${post.slug}`,
                              focus_keyword: post.focus_keyword || '',
                              related_keywords: post.related_keywords,
                              long_tail_keywords: post.long_tail_keywords,
                              search_intent: post.search_intent || '',
                              faq: post.faq,
                              internal_links: post.internal_links,
                              related_urgent_requirements: post.related_urgent_requirements,
                              image_alt: post.image_alt || '',
                              image_caption: post.image_caption || '',
                              reading_time_minutes: post.reading_time_minutes || 1,
                              disclaimer: post.disclaimer || '',
                              adminInputRequired: [],
                              flaggedClaims: [],
                              ai_generated: post.ai_generated,
                            },
                            post.id,
                          )
                        }
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="blogs.publish">
                      {!isPublic ? (
                        <Button size="sm" onClick={() => setStatus({ id: post.id, status: 'published' })}>
                          <Globe2 className="mr-1 h-3.5 w-3.5" />
                          Publish
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus({ id: post.id, status: 'draft' })}
                        >
                          <Lock className="mr-1 h-3.5 w-3.5" />
                          Unpublish
                        </Button>
                      )}
                    </PermissionGuard>
                    <PermissionGuard permission="blogs.delete">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm('Delete this post permanently?')) remove(post.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    review: 'bg-amber-100 text-amber-800 border-amber-200',
    archived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        styles[status] || styles.draft
      }`}
    >
      {status === 'published' ? 'public' : status === 'draft' ? 'private' : status}
    </span>
  )
}
