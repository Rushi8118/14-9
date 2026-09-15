import { Helmet } from 'react-helmet-async'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, Search, Filter, Globe2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { customerReviews, getReviewInitials } from '@/lib/reviews-data'

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("All")

  // Extract unique destination countries from the "India to X" format
  const countries = useMemo(() => {
    const unique = new Set<string>()
    unique.add("All")
    customerReviews.forEach(r => {
      const parts = r.country.split(" to ")
      if (parts.length > 1) {
        unique.add(parts[1])
      }
    })
    return Array.from(unique).sort()
  }, [])

  const filteredReviews = useMemo(() => {
    return customerReviews.filter(review => {
      const matchesSearch = 
        review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.text.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCountry = 
        selectedCountry === "All" || 
        review.country.includes(selectedCountry)

      return matchesSearch && matchesCountry
    })
  }, [searchQuery, selectedCountry])

  return (
    <>
      <Helmet>
        <title>Customer Reviews | Siddhivinayak Overseas</title>
        <meta
          name="description"
          content="Read real reviews from our clients who successfully obtained work and study visas with Siddhivinayak Overseas."
        />
        <link rel="canonical" href="https://siddhivinayakoverseas.com/reviews" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://siddhivinayakoverseas.com/reviews" />
        <meta property="og:title" content="Customer Reviews | Siddhivinayak Overseas" />
        <meta property="og:description" content="Read real reviews from our clients who successfully obtained work and study visas with Siddhivinayak Overseas." />
        <meta property="og:image" content="https://siddhivinayakoverseas.com/consultant-office.jpg" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Customer Reviews | Siddhivinayak Overseas" />
        <meta name="twitter:description" content="Read real reviews from our clients who successfully obtained work and study visas with Siddhivinayak Overseas." />
        <meta name="twitter:image" content="https://siddhivinayakoverseas.com/consultant-office.jpg" />
      </Helmet>
      <SiteHeader />
      <main className="premium-page min-h-screen bg-background pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Customer <span className="text-primary">Reviews</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Read real stories from our clients who achieved their dreams of moving abroad.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between sticky top-20 z-30 bg-background/80 backdrop-blur-md py-4 rounded-xl border border-border/40 px-4 shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full border-primary/20 bg-background focus-visible:ring-primary/30"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
              {countries.map((country) => (
                <Button
                  key={country}
                  variant={selectedCountry === country ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCountry(country)}
                  className={`rounded-full whitespace-nowrap ${
                    selectedCountry === country 
                      ? "bg-primary text-primary-foreground shadow-glow" 
                      : "border-primary/20 hover:bg-primary/5"
                  }`}
                >
                  {country === "All" ? <Globe2 className="mr-2 h-3 w-3" /> : null}
                  {country}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-8 flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredReviews.length} reviews</p>
            { (searchQuery || selectedCountry !== "All") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {setSearchQuery(""); setSelectedCountry("All")}}
                className="text-primary hover:text-primary/80 hover:bg-primary/5"
              >
                Clear all filters
              </Button>
            )}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                >
                  <figure className="h-full relative flex flex-col rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm hover:border-primary/30 transition-colors shadow-sm">
                    <Quote
                      aria-hidden="true"
                      className="absolute right-5 top-5 h-8 w-8 text-primary/10"
                    />
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shadow-inner">
                        {getReviewInitials(review.name)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-none mb-1.5">{review.name}</p>
                        <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <blockquote className="grow text-sm leading-relaxed text-foreground/80 italic">
                      &ldquo;{review.text}&rdquo;
                    </blockquote>

                    <figcaption className="mt-6 border-t border-border/60 pt-4 flex flex-col gap-1">
                      <div className="flex items-center text-xs font-medium text-primary">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 uppercase tracking-wider">
                          {review.visa}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Globe2 className="h-3 w-3" />
                        {review.country}
                      </p>
                    </figcaption>
                  </figure>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">No reviews found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters to find what you're looking for.</p>
              <Button 
                variant="link" 
                onClick={() => {setSearchQuery(""); setSelectedCountry("All")}}
                className="mt-4 text-primary"
              >
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
