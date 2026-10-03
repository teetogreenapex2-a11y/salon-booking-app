HAIRSALONIX — STYLISTS CAN ADD/REMOVE SERVICES
=================================================

On the pricing page (yours or a stylist's own "My pricing"), each service
now has a checkbox: "I don't do this service." Check it and that service
disappears from the booking page entirely for that stylist — customers
booking with them won't see it as an option at all. Uncheck it (or just
never check it) and it's offered normally, using their price/duration
override if they set one, or the business standard price if not.

No database changes — this all reuses the existing per-stylist pricing
table (a $0 price is now the internal signal for "doesn't offer it").

FILES
-------
lib/pricing.ts                                    (replace)
app/api/bookings/route.ts                         (replace)
app/api/bookings/slots/route.ts                   (replace)
components/BookingFlow.tsx                        (replace)
components/AdminBookingFlow.tsx                   (replace)
components/admin/StylistPricingForm.tsx           (replace)
app/admin/stylists/[id]/pricing/page.tsx          (replace)

COMMANDS
----------
    cd C:\Users\User\Downloads\salon-booking-app\salon-app
    tar -xf C:\Users\User\Downloads\hairsalonix-offer-services.zip -C .
    git add .
    git commit -m "Let stylists add/remove which services they offer"
    git push

No npm install, no prisma generate/migrate needed.

TESTING IT
------------
1. Go to a stylist's pricing page (yours, via Stylists, or sign in as that
   stylist and use My pricing).
2. Check "I don't do this service" on one service, save.
3. Go to your public booking page, pick that stylist — that service
   should no longer show up as an option for them.
4. Uncheck it and save again — it should reappear.
