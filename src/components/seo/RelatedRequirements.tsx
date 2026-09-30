import { useMemo } from 'react'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { usePublicUrgentRequirements } from '@/hooks/useUrgentRequirements'

/**
 * Links an urgent requirement to other open vacancies.
 *
 * Same defect as the blog posts and pathways: crawled from the 2026-09-30
 * build, several urgent-requirement pages had exactly one inbound internal
 * link, from the /urgent-requirements index, and nothing else pointed at them.
 * A page linked once from a listing is what Google reports as "Discovered -
 * currently not indexed".
 *
 * These pages have a shorter useful life than the rest of the site -- a
 * vacancy closes and the page goes with it -- which makes the linking matter
 * more, not less: there is a narrow window in which the page has to be crawled
 * at all.
 *
 * Matching is on country and category, both of which the editor already sets.
 * Nothing is inferred about the roles themselves.
 */

type Props = {
  currentSlug: string
  country?: string | null
  category?: string | null
}

const MAX_RELATED = 3

export function RelatedRequirements({ currentSlug, country, category }: Props) {
  const { requirements } = usePublicUrgentRequirements()

  const links = useMemo(() => {
    const scored = (requirements ?? [])
      .filter((r) => r.slug && r.slug !== currentSlug)
      .map((r) => {
        let score = 0
        if (country && r.country === country) score += 2
        if (category && r.category === category) score += 1
        return { r, score }
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        // Stable, deterministic tie-break: the prerenderer must produce the
        // same HTML on every build.
        return a.r.slug.localeCompare(b.r.slug)
      })
      .slice(0, MAX_RELATED)

    return scored.map(({ r }) => ({
      label: r.title,
      to: `/urgent-requirements/${r.slug}`,
      description: [r.country, r.category].filter(Boolean).join(' · ') || undefined,
    }))
  }, [requirements, currentSlug, country, category])

  if (links.length === 0) return null

  return <RelatedLinks title="Other current openings" links={links} />
}
