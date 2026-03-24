# StreamCatalog (Legal Streaming-Style Catalog)

Production-ready Next.js + Prisma platform for legal media catalogs with **authorized third-party embeds only**.

## Highlights
- Next.js App Router + TypeScript + Tailwind CSS
- PostgreSQL + Prisma normalized schema
- Secure email/password auth with bcrypt + signed HTTP-only sessions
- Public catalog: homepage rails, browse filters, show details, watch page with source selector
- User features: watchlist, history, rating
- Admin dashboard with protected CRUD foundations
- SEO: dynamic metadata, robots, sitemap
- Safe-by-design: no scraping, no proxy streaming, no downloading/rehosting copyrighted video

## Proposed Folder Structure

```text
app/
  (public)/
    page.tsx
    browse/page.tsx
    shows/[slug]/page.tsx
    watch/[episodeId]/page.tsx
    login/page.tsx
    register/page.tsx
    profile/page.tsx
    watchlist/page.tsx
    history/page.tsx
  admin/
    page.tsx
    shows/page.tsx
    episodes/page.tsx
    users/page.tsx
  api/
    auth/{login,logout,register}/route.ts
    shows/route.ts
    episodes/route.ts
    bookmarks/route.ts
    history/route.ts
    ratings/route.ts
  layout.tsx
  sitemap.ts
  robots.ts
components/
  layout/{navbar,footer}.tsx
  home/{hero,content-rail}.tsx
  common/show-card.tsx
lib/
  auth/session.ts
  db/prisma.ts
  services/show-service.ts
  validators/{auth,show}.ts
  utils/cn.ts
prisma/
  schema.prisma
  seed.ts
```

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Create env:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migration:
   ```bash
   npm run prisma:migrate -- --name init
   ```
5. Seed data:
   ```bash
   npm run prisma:seed
   ```
6. Start:
   ```bash
   npm run dev
   ```

## Deployment (Vercel + Managed Postgres)
1. Push repository to Git provider.
2. Create Postgres instance (Neon/Supabase/RDS/etc).
3. Configure `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` in Vercel.
4. Run `prisma migrate deploy` during build or post-deploy.
5. Deploy with `npm run build`.

## Future-ready extension points
- Comments + moderation queues via `Comment` model.
- Multi-role ACL via expanded `UserRole` enum.
- Notification pipeline + websockets.
- PWA + offline metadata caching.
- Mobile app API via route handlers and versioned `/api/v1` namespace.
