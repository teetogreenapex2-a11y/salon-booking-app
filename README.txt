HAIRSALONIX — STYLIST SELF-SERVICE PRICING
=============================================

Adds "My pricing" to a stylist's own nav. They can now set their own
price/duration overrides for services (same screen you already use from
the Stylists page), but ONLY for themselves — they can't touch another
stylist's pricing or the business's base services.

No database changes this time — no migrate step needed.

FILES
-------
app/admin/stylists/[id]/pricing/page.tsx    (replace)
app/api/admin/stylists/[id]/pricing/route.ts (replace)
components/StylistNav.tsx                    (replace)
app/admin/layout.tsx                         (replace)

COMMANDS
----------
    cd C:\Users\User\Downloads\salon-booking-app\salon-app
    tar -xf C:\Users\User\Downloads\hairsalonix-stylist-pricing.zip -C .
    git add .
    git commit -m "Let stylists edit their own pricing"
    git push

No npm install, no prisma generate/migrate needed — these 4 files don't
touch dependencies or the database.
