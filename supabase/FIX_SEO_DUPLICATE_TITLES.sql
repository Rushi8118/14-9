-- ============================================================
-- FIX: SEO Duplicate Titles and Length Limits
-- 
-- Run this once in the Supabase SQL Editor.
-- It resolves duplicate titles between blog posts and urgent mandates,
-- and brings metadata lengths under Google's 60 / 160 character recommendations.
-- ============================================================

-- 1) Fix Malta blog post title to avoid duplicate title with the urgent requirement mandate
UPDATE public.blog_posts
SET meta_title = 'Malta Hospitality Jobs: 40 Vacancies Guide & Details'
WHERE slug = 'malta-hospitality-jobs-40-urgent-vacancies';

-- 2) Fix New Zealand blog post title to avoid duplicate title with the urgent requirement mandate
UPDATE public.blog_posts
SET meta_title = 'New Zealand AEWV Warehouse Jobs: NZD 3,000 Guide'
WHERE slug = 'new-zealand-aewv-warehouse-jobs-nzd-3000';

-- 3) Ensure Italy urgent requirement title and meta description stay under Google limits
UPDATE public.urgent_requirements
SET 
  seo_title = 'Italy Healthcare Jobs: 850 Openings for Doctors & Nurses',
  meta_description = 'Apply for 850 urgent healthcare jobs in Italy: Doctors, Nurses, OSS, Care Assistants & Physios. Free food, accommodation and TRC sponsorship included.'
WHERE slug = 'italy-healthcare-jobs-850-urgent-vacancies';
