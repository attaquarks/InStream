# InStream

InStream is a social intelligence dashboard for collecting, processing, and visualizing digital platform activity. It combines a modern Next.js interface with AI-assisted summarization and sentiment analysis so users can monitor trends, engagement, topics, and recent posts from one place.

## What It Does

- Tracks post volume, engagement, reach, sentiment, platform distribution, and trending topics.
- Provides filterable dashboard views by keyword, source, and time range.
- Uses AI flows to summarize trending topics and analyze sentiment.
- Displays activity charts, sentiment breakdowns, word clouds, hashtag rankings, engagement metrics, and recent post tables.
- Includes a Python service layer for collection, processing, NLP utilities, database migrations, and scheduled tasks.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| UI | Radix UI, MUI, lucide-react, Recharts |
| AI | Genkit, Google AI integration |
| Data/Processing | Python, NLP utilities, background tasks |
| Tooling | npm, TypeScript, Next build pipeline |

## Repository Structure

```text
src/
  app/                    Next.js app entry, layout, loading states, dashboard page
  ai/                     Genkit setup and AI flows
  components/dashboard/   Metric cards, charts, filters, tables, topic widgets
  components/ui/          Reusable UI primitives
  services/               Dashboard and platform data services
  python/                 Collector, analyzer, processor, database, scheduler
docs/
  blueprint.md            Product goals, core features, and style direction
```

## Key Features

- **Dashboard analytics:** quick metrics for total posts, engagement rate, sentiment, and reach.
- **Trend exploration:** activity charts, top hashtags, word cloud, and recent posts.
- **Sentiment intelligence:** AI-assisted sentiment analysis for social content.
- **Configurable filters:** source, keyword, and time-range driven views.
- **Extensible architecture:** separate services for dashboard data, AI flows, and Python processing.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+ if you plan to run the Python collection/processing layer

### Install

```bash
npm install
```

### Run the Web App

```bash
npm run dev
```

The app starts on:

```text
http://localhost:9002
```

### Run Genkit AI Flows

```bash
npm run genkit:dev
```

For watch mode:

```bash
npm run genkit:watch
```

## Useful Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production app |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript type checks |
| `npm run genkit:dev` | Start Genkit for local AI flow development |

## Roadmap

- Connect live platform APIs for continuous data ingestion.
- Add persisted database-backed datasets for repeatable analysis.
- Expand export options for reports and filtered dashboard views.
- Add scheduled collection jobs and deployment documentation.

## Project Status

This repository is a working social analytics dashboard prototype with a polished UI foundation and AI/data-processing hooks prepared for deeper platform integration.
