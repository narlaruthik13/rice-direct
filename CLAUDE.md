# Rice Direct (working name: "Vari Direct")

## Concept
A direct rice marketplace: Farmer → Rice Mill → Customer, with no middlemen.

**Business model: Model B (toll milling).**
- The farmer OWNS the paddy and the resulting rice.
- The mill is a SERVICE partner: it mills the farmer's paddy for a processing fee.
- The farmer sells the rice directly to customers through the platform.
- Every bag carries a batch ID and is traceable: farmer, village, variety, harvest date, mill, milling date, quality report.
- Price transparency on every product: farmer share + milling fee + platform fee = customer price.

## Current Phase: Phase 1 (customer-facing e-commerce webpage only)
- Frontend only, with mock data from `data/mock.ts`.
- There is NO backend, NO database, and NO real payments yet.
- Checkout uses a mock "pay" step. Razorpay comes in Phase 3. It needs a backend for order creation and signature verification, so it must never be done on the client with a secret key.

## Later Phases (do NOT build yet)
- Phase 2: NestJS + PostgreSQL + Prisma backend; replace mock data with APIs.
- Phase 3: Razorpay integration (server creates order → client Checkout.js → server verifies signature + webhook).
- Phase 4: Admin, farmer, and mill dashboards.

## Tech Stack
- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- GSAP + ScrollTrigger for the scroll-synced hero story
- Framer Motion for UI micro-animations
- HTML Canvas for grain particles (falling paddy and rice)
- Zustand for cart state

## Design
- Earthy palette: deep field green, paddy gold, husk brown, rice off-white.
- Warm, natural, premium feel. Mobile-first and responsive.
- Respect `prefers-reduced-motion` (show static fallbacks).

## Pages
1. `/`: animated hero story, featured rice, how it works, farmer stories
2. `/shop`: filters (variety, price, farm, new or aged)
3. `/product/[id]`: batch story, farmer + mill info, price breakdown, quality report
4. `/cart` and `/checkout` (mock payment)
5. `/trace/[batchId]`: the page a bag's QR code opens
6. Order success page and login (UI only)

## Hero Animation Story (scroll-synced, in order)
1. Grow: SVG paddy stalks rise from soil and sway in the wind.
2. Ripen: green turns to gold, and grain heads bend under their weight.
3. Spill: paddy grains fall from the heads into a heap (canvas particles).
4. Mill: husks crack off and golden paddy becomes white rice.
5. Pour: rice pours into a bag labelled with the farmer's name, then the "Shop Now" CTA appears.
- Bonus: on "Add to Cart", a few grains fly into the cart icon.

## Folder Structure
```
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
lib/types.ts
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

## Working Rules for Claude
- Work ONE step at a time. Stop after each step and wait for my "next".
- Keep changes small and testable. Tell me how to verify each step in the browser.
- For edits to existing files, make targeted changes rather than rewriting whole files.
- Explain the "why" behind key decisions briefly in Telugu, with code and identifiers in English.
- Do not add a backend, database, auth provider, or real payment code in Phase 1.
