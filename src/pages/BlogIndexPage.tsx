import { Link } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { ArrowRight, BookOpen } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { usePublicBlogPosts } from '@/hooks/useAdminBlogPosts'
import { format } from 'date-fns'

export default function BlogIndexPage() {
  const { data: posts = [], isLoading } = usePublicBlogPosts()

  return (
    <>
      <SeoHead
        title="Visa & Study Abroad Blog"
        description="Expert guides on study visas, work visas, documents and country pathways for Indian applicants from Siddhivinayak Overseas, Surat."
        path="/blog"
      />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border bg-muted/30 px-4 pt-28 pb-10 md:px-6 md:pt-36 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Blog</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-foreground md:text-4xl">
              Guides for students & workers from Surat
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Practical articles on study visas, work visas, documents and destination pathways —
              written for Indian applicants and families.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No published posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Public articles will appear here after an admin publishes from the AI blog writer.
              </p>
              <Link to="/guides" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                Browse guides <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <span>{post.category.replace(/_/g, ' ')}</span>
                    {post.published_at && (
                      <>
                        <span>·</span>
                        <time dateTime={post.published_at}>
                          {format(new Date(post.published_at), 'MMM d, yyyy')}
                        </time>
                      </>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
