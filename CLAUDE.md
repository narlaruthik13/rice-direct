# Kisa

**Brand line:** Kisa — mill-fresh rice (~~Kisa — farmer-owned food~~: superseded)
**Tagline (hero / footer):** Mill-fresh rice, honestly priced. (~~Straight from the farmer. Traceable to the field.~~: superseded)

## Business model (CURRENT — replaces the farmer / two-model / onion model below)
Kisa is a **rice-only brand**. Partner mills pack rice in Kisa-branded bags, and Kisa sells directly to customers. "No middlemen" means **mill → Kisa → customer**.

- **Rice only.** No onions or other crops. Partners are **mills only** (no packhouses).
- **No farmers anywhere.** The farmer concept is removed from the product, the data and the UI (customer website and admin).
- **Mills are never shown to customers:** not on product pages, labels, trace pages or anywhere public. The admin still records which mill packed each batch, for payouts and quality accountability.
- **One sales model.** Price = mill price + Kisa margin. Customers see only the total price (no price breakdown).
- **Product** = variety + type + age + pack size:
  - variety: an admin-managed list (Sona Masoori, BPT 5204, HMT, ...)
  - type: RAW, STEAM or BOILED
  - age: new or aged
  - pack size: 5, 10 or 25 kg
- **Public trace page = "Quality Passport":** variety, type, milling date, packed date, best-before date and the quality report. No mill, no farmer.
- **Hero animation stays.** Only the bag label (Kisa + variety) and the ending line change. Ending line: "From the mill to your plate."
- **Payouts are per mill, weekly.**
- Status: the code (Phase 1/1.5 website, Phase 2 steps 2-5) still implements the old model and will be migrated to this one.

## Concept (SUPERSEDED by "Business model (CURRENT)" above)
A direct food marketplace (rice and onions to start): Farmer → processing partner (rice mill / onion packhouse) → Customer, with no middlemen.

**Business model (SUPERSEDED)**
- The platform supports TWO sales models per product:
  - FARMER_OWNED (Model B, toll processing): farmer owns the produce, pays the partner a processing fee, sells directly. Price = farmer share + processing fee + platform fee.
  - PARTNER_SOURCED (Model A): partner buys from the farmer at a published price, processes and sells. Price = price paid to farmer + partner margin + platform fee. The farmer stays visible on product and trace pages.
- Both models apply to every category.

## Categories (SUPERSEDED: rice only, mills only; see "Business model (CURRENT)")
- Rice: partner type MILL; steps harvest → milling → packing; attributes: variety, aged/new, broken %, moisture; packs 5/10/25 kg.
- Onions: partner type PACKHOUSE; steps harvest → curing → grading → packing; attributes: variety (Nashik Red, Bellary, Kurnool), size grade, curing days, shelf life; packs 1/2/5/10 kg; perishable.
- Categories are config-driven from `lib/categories.ts` so new crops can be added later without changing components.
- One shared cart and checkout across categories.

## Phase 1.5: UI enhancements (complete and live; was frontend + mock data only)
- Frontend only, with mock data from `data/mock.ts`.
- There is NO backend, NO database, and NO real payments yet.
- Checkout uses a mock "pay" step. Razorpay comes in Phase 3. It needs a backend for order creation and signature verification, so it must never be done on the client with a secret key.

## Phase 2: Monorepo + Admin (CURRENT PHASE)
Phase 1 and Phase 1.5 are complete and live. Phase 2 moves the project into a monorepo and adds the backend and the admin panel.

### Target structure
- Turborepo + pnpm workspaces
- `apps/web`: customer website (the current Next.js app, moved here)
- `apps/admin`: admin panel (Next.js App Router + TypeScript + Tailwind + shadcn/ui + TanStack Table + react-hook-form + zod)
- `apps/api`: backend (NestJS + Prisma), the single source of truth for all apps, including a future mobile app
- `packages/db`: Prisma schema, migrations, seed, client
- `packages/shared`: shared TypeScript types and zod schemas (Product, Batch, Partner (mill), Order, OrderStatus, ...; ~~Farmer, SalesModel, Category~~ superseded by the rice-only model)
- `packages/config`: shared Tailwind preset (brand colour tokens), tsconfig base, eslint config

### Admin design rules
- Same brand colours as web, from the shared Tailwind preset.
- Clean and fast. Only subtle UI motion: hover, page fade, skeleton loaders, toasts.
- No GSAP, no canvas, no scroll animations.
- Responsive, so it works on a phone too.

### Business rules
- Local delivery in Hyderabad only, with serviceable pincodes and delivery slots.
- Order status: PLACED → PAID → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED, plus CANCELLED and REFUNDED.
- Stock is tracked per batch in kg and reduced when an order is paid. Overselling must be prevented.
- ~~Onions are perishable: sell the oldest batch first (FIFO) and hide batches past their shelf life.~~ (superseded: no onions; rice batches have a best-before date shown on the Quality Passport)
- Delivery is confirmed with a customer OTP.
- ~~Payouts are per order, split by sales model (farmer share / partner fee / platform fee) and settled weekly.~~ (superseded) Payouts are **per mill, weekly**: the mill price of everything sold from that mill's batches.

### Hosting
- `apps/web` + `apps/admin` on Vercel.
- `apps/api` on Railway or Render.
- PostgreSQL in the Mumbai region (or the nearest available).

### Databases (Neon)
- Local development and tests use the Neon **"dev"** branch. Its URLs go in `packages/db/.env` and `apps/api/.env` (both git-ignored).
- The **"production"** branch is only for the deployed API. Its URLs are set on the hosting platform, never in local files.
- `DATABASE_URL` is the pooled connection (runtime); `DIRECT_URL` is the direct connection (Prisma Migrate).

### Deployment checklist (before the first production deploy)
- **Refresh-token reuse grace period:** the admin's single-flight refresh is in-memory, so on Vercel (several middleware instances) parallel refreshes can still trip the API's token-reuse protection and sign an admin out. Add a short grace period (~10 s) in the API during which a just-rotated refresh token is accepted.
- **Login rate limiting by email + IP, with a trusted forwarded IP:** the API sees every admin login coming from the admin server's IP, so the per-IP limit is shared by all admins. Rate-limit by email + client IP, where the admin server forwards the client IP and the API trusts it only from the admin server (shared secret header).
- Run `prisma migrate deploy` against the production branch from the hosting platform or CI (never from a local machine).

### Phase 2 build steps (one at a time)
1. Restructure into the monorepo (no visual change)
2. `packages/db`: schema + seed from current mock data
3. `apps/api`: NestJS modules + admin auth
4. `apps/admin`: shell (login, sidebar, theme, dashboard)
5. Admin: farmers, partners, batches/products
6. Admin: orders + status workflow + stock
7. Admin: delivery (pincodes, slots, assignment)

## Later Phases (do NOT build yet)
- Phase 3: Razorpay integration (server creates order → client Checkout.js → server verifies signature + webhook).
- Phase 4: Mill dashboards. (~~Farmer and packhouse dashboards~~: superseded.)

## Tech Stack (apps/web)
- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- GSAP + ScrollTrigger for the scroll-synced hero story
- Framer Motion for UI micro-animations
- HTML Canvas for grain particles (falling paddy and rice)
- Zustand for cart state

## Design (apps/web)
- Earthy palette: deep field green, paddy gold, husk brown, rice off-white.
- Warm, natural, premium feel. Mobile-first and responsive.
- Respect `prefers-reduced-motion` (show static fallbacks).

## Pages
1. `/`: animated hero story, featured rice, how it works, ~~farmer stories~~ (superseded)
2. `/shop`: filters (variety, type, price, new or aged; ~~farm~~ superseded)
3. `/product/[id]`: variety, type, age, pack size, total price, quality report (~~batch story, farmer + mill info, price breakdown~~ superseded)
4. `/cart` and `/checkout` (mock payment)
5. `/trace/[batchId]`: the **Quality Passport** a bag's QR code opens (variety, type, milling date, packed date, best-before date, quality report; no mill, no farmer)
6. Order success page and login (UI only)
7. ~~`/shop/rice` and `/shop/onions`: category shop pages~~ (superseded: rice only)
8. ~~Home page: a category switcher below the hero~~ (superseded: rice only)

## Hero Animation Story (scroll-synced, in order)
1. Grow: SVG paddy stalks rise from soil and sway in the wind.
2. Ripen: green turns to gold, and grain heads bend under their weight.
3. Spill: paddy grains fall from the heads into a heap (canvas particles).
4. Mill: husks crack off and golden paddy becomes white rice.
5. Pour: rice pours into a bag labelled **Kisa + the variety** (~~the farmer's name~~: superseded), then the ending line "From the mill to your plate." and the "Shop Now" CTA appear.
- Bonus: on "Add to Cart", a few grains fly into the cart icon.

## Folder Structure
```
apps/
  web/                     customer website (Next.js), moved from the repo root
    app/
      page.tsx
      shop/page.tsx
      product/[id]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      trace/[batchId]/page.tsx
    components/
      hero/      (PaddyField, GrainSpill, MillingScene, RicePour)
      product/   (ProductCard, PriceBreakdown, BatchStory)
      ui/        (Navbar, Footer, Button)
    data/mock.ts
    store/cart.ts
    lib/categories.ts
  admin/                   admin panel (Next.js + shadcn/ui)
  api/                     backend (NestJS + Prisma)
packages/
  db/                      Prisma schema, migrations, seed, client
  shared/                  shared TypeScript types + zod schemas
  config/                  Tailwind preset, tsconfig base, eslint config
```

## Build Steps (one at a time)
1. Project setup + install dependencies
2. Mock data + types (Farmer, Mill, Batch, Product, CartItem)
3. Layout, Navbar, Footer, theme tokens
4. Hero part 1: paddy growing
5. Hero part 2: grain spill + milling
6. Hero part 3: rice pour + CTA
7. Shop, product detail, cart
8. Checkout UI + trace page

## Phase 1.5 Build Steps (history; onions, two models and farmer content are SUPERSEDED)
1. Types + category config + mock data
2. Generalise components (ProductCard, PriceBreakdown, TraceTimeline, BatchStory)
3. Model badges, "Sold by" filter, How it works toggle
4. Category switcher + category routes
5. Onion story animation
6. Polish + responsiveness review

## Working Rules for Claude
- Work ONE step at a time. Stop after each step and wait for my "next".
- Keep changes small and testable. Tell me how to verify each step in the browser.
- For edits to existing files, make targeted changes rather than rewriting whole files.
- Explain the "why" behind key decisions briefly in Telugu, with code and identifiers in English.
- Phase 1 / 1.5 history: those phases had no backend, database, auth provider, or real payment code. In Phase 2, backend, database and admin auth go only in `apps/api` and `packages/db`, following the Phase 2 build steps. Real payment code (Razorpay) still waits for Phase 3.
