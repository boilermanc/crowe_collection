<div align="center">
<img width="1200" height="475" alt="Rekkrd Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Rekkrd

**AI-powered vinyl record collection management**

[rekkrd.com](https://rekkrd.com)

</div>

---

## What is Rekkrd?

Rekkrd helps vinyl collectors catalog, organize, and enjoy their record collections. Snap a photo of any album cover and let AI handle the rest — identification, metadata, cover art, and more.

### Key Features

- **AI Record Identification** — Scan a vinyl cover with your phone camera and Gemini Vision identifies the album, artist, and metadata instantly
- **Collection Management** — Browse, search, sort, and filter your collection in grid or list views with condition grading, notes, and tags
- **PlaylistStudio** — Generate mood-based playlists from your own collection using AI
- **Stakkd** — Catalog your audio gear (turntables, amps, speakers) with AI-powered identification
- **Wantlist** — Track desired records with real-time Discogs pricing
- **Blog** — AI-generated content about vinyl culture, gear, and collecting
- **Sellr** — Vinyl collection appraisal services

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Backend | Express / Node.js |
| Database & Storage | Supabase (PostgreSQL) |
| AI | Google Gemini API |
| External APIs | iTunes Search, MusicBrainz, Discogs |
| Payments | Stripe |
| Email | Resend |
| Automation | n8n (self-hosted) |
| CDN / Security | Cloudflare |
| CI/CD | GitHub Actions |

## Local Development

**Prerequisites:** Node.js v18+

1. Clone the repo:
   ```bash
   git clone https://github.com/boilermanc/rekkrd.git
   cd rekkrd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the required environment variables (see `.env.example` or `CLAUDE.md` for the full list)

4. Run the dev server (frontend + backend):
   ```bash
   npm run dev
   ```

## Project Structure

```
src/                     # React frontend
├── components/          # UI components
├── pages/               # Route pages
├── services/            # Supabase & Gemini clients
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── admin/               # Admin panel
└── types.ts             # Shared TypeScript types

server/                  # Express backend
├── routes/              # API route handlers
├── services/            # Business logic
├── middleware/           # Auth, admin checks
├── lib/                 # Subscription/plan logic
└── migrations/          # SQL migrations
```

## Deployment

Deployed on an IONOS VPS with Plesk, PM2 process management, and nginx reverse proxy. Cloudflare handles DNS, CDN, and SSL. GitHub Actions auto-deploys on push to `main`.

## License

Private — All rights reserved.
