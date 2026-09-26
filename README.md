# Salon Booking

Hairstylist booking app scaffold, structured the same way as BookMyPro:
Next.js App Router, Prisma, `[slug]`-based multi-tenant routing, Stripe
Connect placeholder for deposits.

## Structure

- `app/[slug]/page.tsx` — public business profile page
- `app/[slug]/book/page.tsx` — service + stylist selection, then calendar
- `app/[slug]/book/confirm/page.tsx` — booking confirmation
- `app/api/bookings/slots/route.ts` — computes open slots for a stylist/date
- `app/api/bookings/route.ts` — creates a booking with a double-book guard
- `prisma/schema.prisma` — Business, Stylist, Service, Availability, Booking
- `lib/availability.ts` — slot math (weekly availability minus existing bookings)

## Local setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum
npx prisma migrate dev --name init
npx prisma db seed        # loads the Studio Fern demo salon
npm run dev
```

Visit `http://localhost:3000/studio-fern` and `http://localhost:3000/studio-fern/book`.

## Not yet wired up (same TODOs called out in the code)

- Stripe Connect deposit charge on booking creation (`app/api/bookings/route.ts`)
- Confirmation email/SMS + stylist push notification on booking creation
- Google/Outlook calendar sync merged into `getOpenSlots` (currently only
  checks against other bookings in this app, not external calendar busy time)
- Auth for the business owner's admin/dashboard side — this scaffold is
  customer-facing only
- Before/after photo gallery (Vercel Blob upload, same pattern as BookMyPro's
  Swing Sketch feature)

## Deploy

Same as BookMyPro: push to GitHub, connect the repo in Vercel, set the env
vars from `.env.example` in the Vercel project settings, point `DATABASE_URL`
at a hosted Postgres instance (Neon/Supabase both work fine on the free tier
for this stage).
