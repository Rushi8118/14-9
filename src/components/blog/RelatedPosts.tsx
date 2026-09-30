import { useMemo } from 'react'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { usePublicBlogPosts } from '@/hooks/useAdminBlogPosts'

/**
 * Links a blog post to the three most related published posts.
 *
 * WHY
 *
 * Crawled from production on 2026-09-30: every one of the 11 published blog
 * posts had exactly ONE inbound internal link, from the /blog index. Nothing
 * cross-linked. Search Console reported 7 pages as "Discovered - currently not
 * indexed", which is what Google says about a URL it found in a sitemap, saw
 * linked once from a listing page, and judged not worth crawling.
 *
 * The post bodies live in Supabase, so the durable fix -- editorial links
 * written into the prose -- has to happen in the admin panel. This component
 * is the structural half: every post gains three contextual outbound links and,
 * because the selection is mutual in aggregate, three or so inbound ones.
 *
 * It does not invent relationships. Posts are matched on the category and tags
 * the editor already assigned; where there is nothing in common it falls back
 * to the most recent posts rather than showing an empty section, because a
 * recent-posts link is still a real link.
 */

type Props = {
  /** Slug of the post being viewed, so it never links to itself. */
  currentSlug: string
  category?: string | null
  tags?: string[] | null
}

const MAX_RELATED = 3

export function RelatedPosts({ currentSlug, category, tags }: Props) {
  const { data: posts = [] } = usePublicBlogPosts()

  const links = useMemo(() => {
    const currentTags = new Set((tags ?? []).filter(Boolean).map((t) => t.toLowerCase()))

    const scored = posts
      .filter((p) => p.slug && p.slug !== currentSlug)
      .map((p) => {
        let score = 0
        // Same category is the strongest signal the editor gives us.
        if (category && p.category && p.category === category) score += 3
        for (const tag of (p.tags ?? []) as string[]) {
          if (tag && currentTags.has(tag.toLowerCase())) score += 1
        }
        return { post: p, score }
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        // Tie-break on recency so the choice is stable and deterministic --
        // the prerenderer has to produce the same HTML on every build.
        const at = a.post.published_at ? Date.parse(a.post.published_at) : 0
        const bt = b.post.published_at ? Date.parse(b.post.published_at) : 0
        return bt - at
      })
      .slice(0, MAX_RELATED)

    return scored.map(({ post }) => ({
      label: post.title,
      to: `/blog/${post.slug}`,
      description: post.excerpt || undefined,
    }))
  }, [posts, currentSlug, category, tags])

  if (links.length === 0) return null

  return <RelatedLinks title="Related articles" links={links} />
}
