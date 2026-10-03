HAIRSALONIX — OWNER / STYLIST ACCOUNT ROLES
=============================================

WHAT THIS ADDS
----------------
Two kinds of logins now:
  - OWNER (you) — sees everything, same as before.
  - STYLIST — a login that only sees their own Calendar, Reports, and
    Hours, and can't get into customers, services, billing, business
    settings, or other stylists' data.

To give a stylist a login: open Stylists in the admin, type their email
into the new "Login email" box on their row, click Save. They then sign
in at hairsalonix.com/login the normal email-link way (no password needed
for them) — their own email just needs to be on file first.

Along the way I also found and fixed a real bug: the "Save hours" button
on the Hours page was silently broken (its server file had the wrong
name, so it 404'd every time you tried to save). Fixed as part of this
same update.

HOW THIS IS DIFFERENT FROM THE LAST ZIP
------------------------------------------
This one touches 24 files, which is too many to drag one at a time, so
this time the zip gets extracted DIRECTLY into your project folder — tar
creates any new folders by itself and overwrites the files that changed.
No separate staging folder, no manual dragging.

FULL COMMAND SEQUENCE
------------------------
Open Command Prompt and run these one at a time:

    cd C:\Users\User\Downloads\salon-booking-app\salon-app
    del app\api\admin\availability\api-admin-availability-route.ts
    tar -xf C:\Users\User\Downloads\hairsalonix-stylist-roles.zip -C .
    npm install
    npx prisma generate
    npx prisma migrate deploy
    git add .
    git commit -m "Add owner/stylist account roles, fix broken Hours save"
    git push

(Adjust the zip path in the tar command if it downloaded somewhere other
than Downloads.)

The migrate command only ADDS one new column (Stylist.email) — it will
not touch or reset any existing data.

TESTING IT
------------
1. Go to Stylists in your admin, type a test email into "Login email" on
   one stylist, click Save.
2. Open an incognito window, go to hairsalonix.com/login, sign in with
   that email (email link, same as always).
3. You should land on a Calendar that only shows that one stylist's
   column, with a nav bar showing just Calendar / Reports / My hours —
   nothing else.
4. Log back in as yourself (the owner) and confirm everything still looks
   normal — full nav, all stylists visible, etc.
