# Weekly Event Automation Frontend

This repository contains the frontend for a weekly events dashboard. The app reads event data from Supabase and displays a curated view of events happening during the current week.

The data flow is:

1. n8n runs an automated workflow.
2. The workflow scrapes weather data for cities and event listings for the current week.
3. The processed data is stored in Supabase.
4. This frontend fetches the weekly events from a Supabase RPC endpoint and renders them in the browser.

## What The App Does

- Fetches weekly event data from Supabase.
- Displays the events in a responsive dashboard.
- Highlights featured events, event counts, date range, and top locations.
- Supports search and filtering for better browsing.
- Uses a shared UI package for reusable components and global styling.

## Project Structure

This is a small monorepo with two main parts:

```text
.
├── apps/
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── components/
│       │       └── theme-provider.tsx
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   └── ui/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── styles/
│       │       └── globals.css
│       └── package.json
├── package.json
├── turbo.json
└── README.md
```

### Key folders

- `apps/web`: The React + Vite frontend application.
- `apps/web/src/App.tsx`: Main dashboard screen and Supabase data fetching logic.
- `apps/web/src/main.tsx`: App bootstrap and provider setup.
- `packages/ui`: Shared UI package used across the monorepo.
- `packages/ui/src/components`: Reusable UI components such as buttons.
- `packages/ui/src/styles/globals.css`: Global Tailwind and theme styles.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style component primitives
- Turbo for monorepo scripts
- Supabase as the backend data source

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm 11 or newer

### Install dependencies

From the repository root, install all workspace dependencies:

```bash
npm install
```

### Run the frontend locally

Start the development server for the web app:

```bash
npm run dev --workspace web
```

Vite will print a local URL, usually `http://localhost:5173`.

### Build for production

```bash
npm run build
```

### Check types

```bash
npm run typecheck
```

### Lint the workspace

```bash
npm run lint
```

## How The Frontend Connects To Supabase

The main dashboard in `apps/web/src/App.tsx` fetches event data from a Supabase RPC endpoint named `get_weekly_events`.

The response is normalized in the client before rendering:

- HTML entities are decoded in titles, descriptions, and location fields.
- Events are grouped and sorted by date and time.
- Summary stats such as total events, recurring events, locations, and coverage days are computed on the client.

If you change the backend endpoint or Supabase project details, update the fetch configuration in `apps/web/src/App.tsx`.

## UI Notes

- The app uses a shared theme provider and global styles from `packages/ui`.
- Typography and layout are tuned for a dashboard-style weekly overview.
- The UI is responsive and supports a compact mobile navigation state.

## Shared UI Package

The `packages/ui` workspace holds reusable primitives and shared styling.

Example usage:

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Scripts

Available root scripts:

- `npm run dev`: Start all development tasks through Turbo.
- `npm run build`: Build the workspace.
- `npm run lint`: Run lint checks.
- `npm run format`: Format files with Prettier.
- `npm run typecheck`: Run TypeScript checks.

## Notes For Contributors

- Keep frontend changes inside `apps/web` unless you are updating shared UI primitives.
- Prefer reusing components from `packages/ui` when adding new UI elements.
- The repository currently focuses on the frontend only; Supabase and n8n handle ingestion and storage.
