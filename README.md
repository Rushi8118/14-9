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
| `npm run build` | Builds the application, generates the sitemap, and prerenders configured pages. |
| `npm run build:only` | Runs only the Vite production build. |
| `npm run preview` | Serves the production build locally for verification. |
| `npm run lint` | Runs ESLint across the repository. |
| `npm run sitemap` | Generates the sitemap without building the application. |
| `npm run prerender` | Runs the prerendering script. |
| `npm run seo:ping` | Sends the configured SEO/indexing ping. |

A typical verification flow is:

```bash
npm run lint
npm run build
npm run preview
```

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

The project includes SEO-related scripts and files for:

- Sitemap generation.
- Robots configuration.
- Prerendering selected routes.
- Canonical site URL configuration.
- Search-engine indexing notifications.

After changing public routes or content, run a production build and inspect the generated output before deployment.

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
