import { Link, useParams } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BlogContent } from '@/components/blog/BlogContent'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { ServingRegions } from '@/components/seo/ServingRegions'
import { usePublicBlogPost } from '@/hooks/useAdminBlogPosts'
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site'
import { format } from 'date-fns'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading } = usePublicBlogPost(slug)

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted/70" />
            ))}
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!post) {
    return (
      <>
        {/*
          Apache cannot know whether a slug exists — it is a Supabase row — so
          .htaccess hands every /blog/* URL to app-shell.html with HTTP 200.
          A missing slug therefore renders this screen under a 200, which is a
          soft 404: without the noindex below, Google is free to index "Post not
          found" as a real page, titled with the shell's fallback because nothing
          else set one.

          noindex is the part that can be fixed from here. Returning a real 404
          status needs something executing per request, which on this hosting
          means the Cloudflare SEO Worker (workers/seo-head/) — it already
          answers 404 for a slug that is missing or unpublished, and is not
          deployed yet. Until then this keeps the URL out of the index.
        */}
        <SeoHead
          title="Post Not Found"
          description="This article is private, unpublished, or the link is incorrect."
          path={`/blog/${slug ?? ''}`}
          noindex
        />
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This article is private, unpublished, or the link is incorrect.
          </p>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-1 text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </main>
        <SiteFooter />
      </>
    )
  }

  let title = post.meta_title || post.title
  // Avoid exact title collision with corresponding urgent requirement job mandates
  if (post.slug === 'malta-hospitality-jobs-40-urgent-vacancies' && title.startsWith('Malta Hospitality Jobs: 40 Urgent Vacancies')) {
    title = 'Malta Hospitality Jobs: 40 Vacancies Guide & Details'
  } else if (post.slug === 'new-zealand-aewv-warehouse-jobs-nzd-3000' && title.startsWith('New Zealand AEWV Warehouse Jobs: NZD 2,500–3,000')) {
    title = 'New Zealand AEWV Warehouse Jobs: NZD 3,000 Guide'
  }
  const description = post.meta_desc || post.excerpt || ''
  const canonical = post.canonical_url || absoluteUrl(`/blog/${post.slug}`)
  const keywords = (post.keywords || []).join(', ')
  const faqItems = (post.faq || []).filter((f) => f.question?.trim() && f.answer?.trim())

  const schemas = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    articleSchema({
      title: post.title,
      description,
      path: `/blog/${post.slug}`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      image: post.featured_image || undefined,
    }),
    ...(faqItems.length > 0 ? [faqSchema(faqItems)] : []),
  ]

  return (
    <>
      <SeoHead
        title={title}
        description={description}
        path={`/blog/${post.slug}`}
        canonical={canonical}
        type="article"
        image={post.featured_image || undefined}
        jsonLd={schemas}
      />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <article className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          <header className="mt-6 border-b border-border pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {post.category.replace(/_/g, ' ')}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-base text-muted-foreground">{post.excerpt}</p>
            )}
            {post.published_at && (
              <p className="mt-4 text-xs text-muted-foreground">
                Published {format(new Date(post.published_at), 'MMMM d, yyyy')}
                {post.last_reviewed_at && (
                  <> · Last reviewed {format(new Date(post.last_reviewed_at), 'MMMM d, yyyy')}</>
                )}
                {post.reading_time_minutes && <> · {post.reading_time_minutes} min read</>}
                {' '}· {SITE_NAME}
              </p>
            )}
          </header>
          {post.featured_image && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              {/* Dimensions are unknown until the image loads, so the ratio is reserved in CSS to avoid layout shift. */}
              <img
                src={post.featured_image}
                alt={post.image_alt || post.title}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {post.image_caption && (
                <p className="bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">{post.image_caption}</p>
              )}
            </div>
          )}
          <div className="py-8">
            <BlogContent html={post.content} />
            {faqItems.length > 0 && (
              <div className="mt-10 space-y-4 border-t border-border pt-6">
                <h2 className="text-xl font-semibold text-foreground">Frequently asked questions</h2>
                {faqItems.map((item, i) => (
                  <div key={i}>
                    <p className="font-medium text-foreground">{item.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
            {post.disclaimer && (
              <p className="mt-8 border-t border-border pt-4 text-xs italic text-muted-foreground">{post.disclaimer}</p>
            )}
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="font-semibold text-foreground">Need personal guidance?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Book a free consultation with Siddhivinayak Overseas in Surat for study or work visa
              pathways.
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              Contact our Surat office →
            </Link>
          </div>
        </article>
        <RelatedPosts currentSlug={post.slug} category={post.category} tags={post.tags} />
        <ServingRegions seed={post.slug} />
      </main>
      <SiteFooter />
    </>
  )
}
