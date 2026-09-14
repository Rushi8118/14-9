import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

// Type definitions for data
type Country = Database["public"]["Tables"]["countries"]["Row"];
type PublicVisaProgram = Database["public"]["Views"]["public_visa_programs"]["Row"];
type CountryFaq = Database["public"]["Tables"]["country_faqs"]["Row"];
type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

// Dummy data as fallback
const DUMMY_COUNTRIES: Country[] = [
  { 
    id: "1", 
    code: "JPN", 
    slug: "japan", 
    name: "Japan", 
    flag_emoji: "🇯🇵", 
    capital: "Tokyo", 
    description: "Explore work and study opportunities in Japan with our expert guidance.", 
    region: "Asia", 
    subregion: "Eastern Asia", 
    latitude: 36.2048, 
    longitude: 138.2529, 
    currency: "Yen", 
    currency_code: "JPY", 
    language: "Japanese", 
    is_active: true, 
    sort_order: 1, 
    visa_stats: { success_rate: 95 } as any, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(), 
    meta_title: "Japan Visa | Siddhivinayak Overseas", 
    meta_desc: "Work and study visa options for Japan.", 
    why_study: null, 
    why_work: null, 
    lifestyle: null, 
    cost_of_living: null, 
    climate: null, 
    images: null 
  },
  { 
    id: "2", 
    code: "AUS", 
    slug: "australia", 
    name: "Australia", 
    flag_emoji: "🇦🇺", 
    capital: "Canberra", 
    description: "Australia offers excellent work and study visa options.", 
    region: "Oceania", 
    subregion: "Australia and New Zealand", 
    latitude: -25.2744, 
    longitude: 133.7751, 
    currency: "Dollar", 
    currency_code: "AUD", 
    language: "English", 
    is_active: true, 
    sort_order: 2, 
    visa_stats: { success_rate: 92 } as any, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(), 
    meta_title: "Australia Visa | Siddhivinayak Overseas", 
    meta_desc: "Work and study visa options for Australia.", 
    why_study: null, 
    why_work: null, 
    lifestyle: null, 
    cost_of_living: null, 
    climate: null, 
    images: null 
  },
  { 
    id: "3", 
    code: "CAN", 
    slug: "canada", 
    name: "Canada", 
    flag_emoji: "🇨🇦", 
    capital: "Ottawa", 
    description: "Canada is one of the top destinations for immigrants.", 
    region: "Americas", 
    subregion: "Northern America", 
    latitude: 56.1304, 
    longitude: -106.3468, 
    currency: "Dollar", 
    currency_code: "CAD", 
    language: "English, French", 
    is_active: true, 
    sort_order: 3, 
    visa_stats: { success_rate: 98 } as any, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(), 
    meta_title: "Canada Visa | Siddhivinayak Overseas", 
    meta_desc: "Work and study visa options for Canada.", 
    why_study: null, 
    why_work: null, 
    lifestyle: null, 
    cost_of_living: null, 
    climate: null, 
    images: null 
  },
];

// Get all active countries
export function useCountries() {
  return useQuery<Country[], Error>({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Supabase fetch failed, using dummy data:", error);
        return DUMMY_COUNTRIES;
      }

      return data?.length ? data : DUMMY_COUNTRIES;
    },
  });
}

// Get single country by slug
export function useCountryBySlug(slug: string) {
  return useQuery<Country | null, Error>({
    queryKey: ["country", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.warn("Supabase fetch failed, checking dummy data:", error);
        return DUMMY_COUNTRIES.find(c => c.slug === slug) || null;
      }

      return data;
    },
    enabled: !!slug,
  });
}

// Get visa programs by country id
export function useVisaProgramsByCountry(countryId?: string) {
  return useQuery<PublicVisaProgram[], Error>({
    queryKey: ["visaPrograms", countryId],
    queryFn: async () => {
      if (!countryId) return [];

      const { data, error } = await supabase
        .from("public_visa_programs")
        .select("*")
        .eq("country_id", countryId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Supabase fetch failed for programs:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!countryId,
  });
}

// Get single visa program
export function useVisaProgramBySlugs(countrySlug?: string, programSlug?: string) {
  return useQuery<PublicVisaProgram | null, Error>({
    queryKey: ["visaProgram", countrySlug, programSlug],
    queryFn: async () => {
      if (!countrySlug || !programSlug) return null;

      const { data, error } = await supabase
        .from("public_visa_programs")
        .select("*")
        .eq("country_slug", countrySlug)
        .eq("slug", programSlug)
        .maybeSingle();

      if (error) {
        console.warn("Supabase fetch failed for program:", error);
        return null;
      }

      return data;
    },
    enabled: !!countrySlug && !!programSlug,
  });
}

// Get country FAQs
export function useCountryFaqs(countryId?: string) {
  return useQuery<CountryFaq[], Error>({
    queryKey: ["countryFaqs", countryId],
    queryFn: async () => {
      if (!countryId) return [];

      const { data, error } = await supabase
        .from("country_faqs")
        .select("*")
        .eq("country_id", countryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Supabase fetch failed for FAQs:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!countryId,
  });
}

// Get blog posts (published)
export function useBlogPosts() {
  return useQuery<BlogPost[], Error>({
    queryKey: ["blogPosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch failed for blogs:", error);
        return [];
      }

      return data || [];
    },
  });
}
