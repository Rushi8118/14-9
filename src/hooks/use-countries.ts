"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Country = Database["public"]["Tables"]["countries"]["Row"]
type VisaProgram = Database["public"]["Views"]["public_visa_programs"]["Row"]

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("public_countries")
          .select("*")
          .order("sort_order", { ascending: true })

        if (error) throw error
        setCountries(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [])

  const getCountryBySlug = useCallback(
    (slug: string) => countries.find((c) => c.slug === slug),
    [countries]
  )

  return { countries, isLoading, error, getCountryBySlug }
}

export function useCountry(slug: string) {
  const [country, setCountry] = useState<Country | null>(null)
  const [programs, setPrograms] = useState<VisaProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        setIsLoading(true)
        const { data: countryData, error: countryError } = await supabase
          .from("countries")
          .select("*")
          .eq("slug", slug)
          .maybeSingle()

        if (countryError) throw countryError
        setCountry(countryData)

        if (countryData) {
          const { data: programsData, error: programsError } = await supabase
            .from("public_visa_programs")
            .select("*")
            .eq("country_id", countryData.id)
            .order("sort_order", { ascending: true })

          if (programsError) throw programsError
          setPrograms(programsData || [])
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) fetchCountry()
  }, [slug])

  return { country, programs, isLoading, error }
}

export function useVisaPrograms(filters?: { countryId?: string; type?: string; featured?: boolean }) {
  const [programs, setPrograms] = useState<VisaProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true)
        let query = supabase
          .from("public_visa_programs")
          .select("*")
          .order("sort_order", { ascending: true })

        if (filters?.countryId) {
          query = query.eq("country_id", filters.countryId)
        }
        if (filters?.type) {
          query = query.eq("program_type", filters.type)
        }
        if (filters?.featured) {
          query = query.eq("is_featured", true)
        }

        const { data, error } = await query

        if (error) throw error
        setPrograms(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [filters?.countryId, filters?.type, filters?.featured])

  return { programs, isLoading, error }
}

export function useVisaProgram(countrySlug: string, programSlug: string) {
  const [program, setProgram] = useState<VisaProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("public_visa_programs")
          .select("*")
          .eq("country_slug", countrySlug)
          .eq("slug", programSlug)
          .maybeSingle()

        if (error) throw error
        setProgram(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (countrySlug && programSlug) fetchProgram()
  }, [countrySlug, programSlug])

  return { program, isLoading, error }
}
