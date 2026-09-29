# Siddhivinayak Overseas

> A modern visa consultancy platform for discovering work-visa and study-visa opportunities, exploring destination countries, and managing user enquiries and saved information.

[![TypeScript](https://img.shields.io/badge/TypeScript-87.6%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## Contents

- [About the project](#about-the-project)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Supabase setup](#supabase-setup)
- [Production build and deployment](#production-build-and-deployment)
- [SEO](#seo)
- [Code quality and testing](#code-quality-and-testing)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## About the project

Siddhivinayak Overseas is a responsive web application for an overseas education and immigration consultancy. It presents visa destinations and programs in an approachable, visual interface while providing authentication, Supabase-backed data, enquiry flows, and administrative functionality.

The application is built as a Vite-powered React single-page application. TypeScript provides type safety, Tailwind CSS and reusable UI primitives provide the visual system, and Supabase supplies authentication and PostgreSQL data services.

## Features

- Browse countries and destination information.
- Explore work-visa and study-visa services and programs.
- Country and program detail pages with requirements and supporting information.
- User registration, login, session handling, and password recovery through Supabase Auth.
- User dashboard for profile-related information and saved places.
- Admin workflows for managing content and urgent requirements.
- Interactive 3D globe and destination visualisation using Three.js and React Three Fiber.
- Responsive, mobile-first UI with reusable Radix UI components.
- Form validation with React Hook Form and Zod.
- Toast notifications and accessible interactive controls.
- SEO metadata, sitemap generation, robots configuration, and prerendering support.
- Supabase Row Level Security (RLS) for protecting user-owned data.

## Technology stack

### Frontend

- React 19
- TypeScript 5
- Vite 6
- React Router
- Tailwind CSS 4
- Radix UI primitives
- Lucide React icons
- Framer Motion and GSAP
- Three.js, React Three Fiber, Drei, and Three Globe

### Backend and data

- Supabase Auth
- Supabase PostgreSQL
- Supabase JavaScript client
- PostgreSQL functions and policies written in PL/pgSQL

### Tooling

- npm (a `package-lock.json` is included)
- ESLint
- Playwright
- PostCSS and Autoprefixer

## Project structure

```text
.
├── app/                  # Application routes and page-level features
├── auth/                 # Authentication-related screens and flows
├── components/           # Shared application and UI components
├── countries/            # Country data and destination views
├── dashboard/            # Authenticated user dashboard
├── hooks/                # Reusable React hooks
├── lib/                  # Supabase clients and shared utilities
├── public/               # Static assets
├── scripts/              # Sitemap, prerender, and SEO utilities
├── src/                  # Shared source modules and application code
├── styles/               # Global styling and design tokens
├── supabase/             # Database schema, seed data, and migrations
├── types/                # Shared TypeScript types
├── .env.example          # Environment variable template
├── package.json          # Scripts and dependencies
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

Some feature directories are kept at the repository root to match the existing application layout. Prefer following the conventions of the surrounding feature when adding new code.

## Requirements

- Node.js 18 or newer (Node.js 20 LTS is recommended).
- npm 9 or newer.
- A Supabase project for authentication and application data.
- Git for cloning and version control.

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Rushi8118/14-9.git
cd 14-9
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file from the provided template:

```bash
cp .env.example .env.local
```

Fill in the values described in [Environment variables](#environment-variables). Never commit `.env.local` or server-only credentials.

### 4. Configure Supabase

Apply the database schema and seed data as described in [Supabase setup](#supabase-setup).

### 5. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment variables

The client-side application uses Vite variables, which must begin with `VITE_`:

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | URL of the Supabase project. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable/anonymous key for browser requests. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Recommended | Publishable key used by integrations that expect this name. |
| `VITE_SITE_URL` | Yes | Canonical URL of the deployed site. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Privileged Supabase key for trusted server-side scripts only. Never expose it to the browser. |

Example:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SITE_URL=http://localhost:5173

# Keep this out of client bundles and source control.
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

Do not use a service-role key in a `VITE_*` variable. Vite exposes `VITE_*` values to browser code.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Vite build → prerender → sitemap → SEO validation, in that order. Fails on any SEO error. |
| `npm run publish` | The same chain plus a summary of what must be uploaded. See [Publishing](#publishing-content-and-deploying). |
| `npm run build:only` | Runs only the Vite production build. |
| `npm run preview` | Serves the production build locally for verification. |
| `npm run lint` | Runs ESLint across the repository. |
| `npm run sitemap` | Regenerates `sitemap.xml` from an existing prerender manifest. |
| `npm run prerender` | Runs the prerendering script against an existing `dist/`. |
| `npm run validate:seo` | Checks the generated HTML in `dist/`. Exits non-zero on errors. |
| `npm run seo:report` | The same checks, but prints everything and never fails. |
| `npm run check:similarity` | Flags near-duplicate content across generated pages. |
| `npm run seo:ping` | Sends the configured SEO/indexing ping. |

A typical verification flow is:

```bash
npx tsc --noEmit
npm run build
npm run preview
```

### Why the build order matters

`vite build` → `prerender` → `generate-sitemap` → `validate-seo` is not
interchangeable:

- The prerenderer renders `/` **last**, because `dist/index.html` is the SPA
  fallback that `vite preview` serves for every route it has not yet written.
  Rendering the homepage first would leave stale homepage content in the DOM for
  every subsequent route, and the readiness check would pass against it.
- `generate-sitemap.mjs` reads `dist/prerender-manifest.json` and nothing else.
  A URL reaches `sitemap.xml` only if it was published, prerendered, verified,
  self-canonical and not `noindex`. This is why the sitemap is generated *after*
  prerendering, not before: generating it from the intended route list cannot
  tell a real page from one that failed to render.
- `validate-seo.mjs` reads the generated files, not a browser DOM, and cross-checks
  sitemap ⟷ manifest ⟷ generated HTML.

## Publishing content and deploying

**Publishing a blog post or urgent requirement in the admin panel does not update
the search-engine-visible site.** Two things happen, and only one of them is
immediate:

| | Immediately on publish | Only after the next build + upload |
| --- | --- | --- |
| Visitors can open the URL | Yes (React fetches it from Supabase via `app-shell.html`) | — |
| Server-rendered title, description, canonical, Open Graph | No | Yes |
| Listed in `sitemap.xml` | No | Yes |
| Reliably discoverable by Google | No | Yes |

So the workflow after publishing content is:

```bash
npm run publish
```

That runs the full chain, stops at the first failure, and prints the number of
pages rendered, the number of sitemap URLs, and any page that is live for
visitors but absent from the sitemap. Then upload the **entire contents of
`dist/`** to the web root. The site is not updated until that upload completes.

`npm run publish` deliberately does **not** upload anything. No FTP, SFTP, SSH,
rsync or hosting-API code exists in this repository because the hosting provider
and access method have not been supplied. `scripts/publish.mjs` documents the
seam where that would go.

### When a page is not prerendered

The prerenderer refuses to write a page that did not genuinely render — a
loading skeleton, a page whose title never moved off the shell default, a page
with the wrong canonical or with no `<h1>`. Such a page:

- is **excluded from the sitemap**, with the reason printed;
- still **works for visitors**, served by `app-shell.html`;
- is reported as a warning by `validate-seo.mjs`, not an error.

The one case that fails the build is a *static* route failing to prerender,
because `.htaccess` has no fallback for those.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/).
2. Copy the project URL and publishable/anonymous key into `.env.local`.
3. Open the Supabase SQL Editor.
4. Apply the base schema from `supabase/schema.sql`.
5. Apply the seed data from `supabase/seed.sql` if sample content is required.
6. Apply any additional SQL migrations in `supabase/` in the order documented by their filenames.
7. Enable the authentication providers required by the application, such as email/password or Google OAuth.
8. Configure the site URL and redirect URLs in Supabase Authentication settings.
9. Verify that RLS is enabled and that policies allow public content reads while restricting user-owned records to their owners.

The database contains content and user-oriented entities such as countries, visa programs, user profiles, applications, consultations, saved places, notifications, blog content, and FAQs. Review the SQL files before applying changes to a production project.

## Production build and deployment

Build the production assets with:

```bash
npm ci
npm run build
```

The generated static assets can be served by a static host or CDN. Before deployment:

- Set production `VITE_*` variables in the hosting provider.
- Set `VITE_SITE_URL` to the final HTTPS domain.
- Configure SPA fallback/rewrite rules so application routes resolve to the entry document.
- Configure Supabase authentication redirect URLs for the production domain.
- Confirm the generated sitemap and robots configuration use the production URL.
- Never upload `.env.local`, database passwords, or service-role keys.

For Apache-based hosting, the repository includes `.htaccess`; verify the rewrite configuration with your hosting provider before publishing it.

## SEO

All page metadata comes from one component, `src/components/seo/SeoHead.tsx`. No
page emits `<title>`, `<meta>` or `<link rel="canonical">` on its own; React 19
hoists what `SeoHead` renders into `<head>`. `index.html` deliberately carries no
canonical, description or Open Graph tags — React *appends* its hoisted tags
rather than replacing matching static ones, so anything left there would give
every page two of it.

`scripts/validate-seo.mjs` enforces this against the built HTML. It fails the
build on:

- a missing, duplicated, relative or non-self-referencing canonical;
- a missing description, robots directive, Open Graph set, Twitter card or `<html lang>`;
- a `<h1>` count other than 1;
- two indexable pages sharing a title or a meta description;
- JSON-LD that does not parse, or a repeated `@id` within one page;
- a `FAQPage` question or answer that exists in structured data but is not visible
  on the page — Google's structured-data policy requires the markup to describe
  visible content;
- guaranteed-outcome wording, using the same patterns
  (`UNSAFE_CLAIM_PATTERNS` in `src/lib/ai/guardrails.ts`) that screen
  AI-generated content, so hand-written copy is held to the same rule;
- a sitemap URL with no manifest entry, no generated file, or a `noindex` tag.

After changing public routes or content, run `npm run build` and inspect the
generated files in `dist/` — not the browser DevTools, which show the live DOM
rather than what a crawler is served.

## Code quality and testing

Before opening a pull request:

```bash
npm run lint
npm run build
```

When changing authentication, database access, routing, or forms, manually verify the affected flow in a local preview. Playwright is available for browser automation and can be used to add or run end-to-end checks as the test suite grows.

## Security

- Keep `.env.local` out of version control.
- Use only publishable/anonymous Supabase keys in browser code.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and rotate it immediately if exposed.
- Validate and sanitise user input at boundaries.
- Review RLS policies whenever adding or changing a table.
- Do not place private customer, application, or credential data in public seed files.
- Use HTTPS and production redirect URLs in deployed environments.

## Contributing

1. Create a feature branch from the default branch.
2. Make focused changes that follow the existing TypeScript and component patterns.
3. Run `npm run lint` and `npm run build`.
4. Update documentation or database migrations when behaviour changes.
5. Open a pull request with a clear summary, testing notes, and screenshots for visual changes.

## License

This project is licensed under the [MIT License](LICENSE), unless a different license is specified in the repository.

## Support

For project-specific issues, open a GitHub issue with:

- A concise description of the problem.
- Steps to reproduce it.
- Expected and actual behaviour.
- Relevant browser or build logs with secrets removed.
- The affected route, component, or database migration.

For platform documentation, see the [Vite](https://vite.dev/guide/), [React](https://react.dev/learn), and [Supabase](https://supabase.com/docs) documentation.
