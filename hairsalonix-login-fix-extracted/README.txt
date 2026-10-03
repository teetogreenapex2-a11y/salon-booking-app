HAIRSALONIX — LOGIN LOOP FIX + PASSWORD SIGN-IN
=================================================

WHAT THIS FIXES
----------------
Your /admin pages check "are you signed in?" using something called
middleware, which cannot look things up in the database. Your sign-in was
set up in a way that REQUIRED a database lookup to confirm you were signed
in. So even after a perfectly successful sign-in, middleware always said
"nope, not signed in" and sent you back to the login page. That was the
loop. This fix switches the sign-in method to one middleware can actually
read, so it stops looping.

It also adds an email+password sign-in option (your ask), so you don't
have to round-trip through email every time. Only accounts that have a
password set can use it — everyone else keeps using the email link.

FILES IN THIS ZIP
------------------
package.json                                                     (replace)
prisma/schema.prisma                                              (replace)
prisma/migrations/20261003140000_add_user_password/migration.sql (new file, new folder)
lib/auth.ts                                                       (replace)
app/login/page.tsx                                                (replace)
scripts/hash-password.js                                          (new file, new folder)

STEP 1 — Create the two new folders in your PROJECT (not here)
-----------------------------------------------------------------
Open Command Prompt and run:

    cd C:\Users\User\Downloads\salon-booking-app\salon-app
    mkdir scripts
    mkdir prisma\migrations\20261003140000_add_user_password

STEP 2 — Extract this zip
---------------------------
Still in Command Prompt:

    mkdir hairsalonix-login-fix-extracted
    tar -xf C:\Users\User\Downloads\hairsalonix-login-fix.zip -C hairsalonix-login-fix-extracted

(Adjust the zip path above if it downloaded somewhere other than Downloads.)

STEP 3 — Copy the files into place
------------------------------------
Open the "hairsalonix-login-fix-extracted" folder in File Explorer, then
drag each file into the matching spot in your salon-app project, replacing
the existing file (or dropping into the new empty folder for new files):

    package.json                 -> salon-app\package.json                (overwrite)
    prisma\schema.prisma         -> salon-app\prisma\schema.prisma        (overwrite)
    prisma\migrations\20261003140000_add_user_password\migration.sql
                                  -> the matching NEW folder you just made (step 1)
    lib\auth.ts                  -> salon-app\lib\auth.ts                 (overwrite)
    app\login\page.tsx           -> salon-app\app\login\page.tsx          (overwrite)
    scripts\hash-password.js     -> the NEW "scripts" folder you just made (step 1)

STEP 4 — Install the new package and update the database
-------------------------------------------------------------
Back in Command Prompt, still in the salon-app folder:

    npm install
    npx prisma generate
    npx prisma migrate deploy

That last command only ADDS one new column (passwordHash) to the User
table — it will not touch or reset any existing data.

STEP 5 — Set a password for your own admin login (optional, do this if
you want password sign-in working right away)
-------------------------------------------------------------------------
Pick any password you want. Run (replace YourChosenPassword):

    node scripts\hash-password.js YourChosenPassword

It prints a long scrambled string starting with $2. Copy that whole
string, then:

    npx prisma studio

In the browser tab that opens, click the "User" table, find the row for
the email you want to use, click into its "passwordHash" field, paste the
scrambled string, and save (click away from the field or hit the save
icon). Close Prisma Studio's browser tab when done, then Ctrl+C in
Command Prompt to stop it.

STEP 6 — Push it live
------------------------
    git add .
    git commit -m "Fix login loop, add password sign-in"
    git push

Vercel will redeploy automatically.

STEP 7 — Test it
--------------------
Go to hairsalonix.com/login, click "Have a password instead?", enter your
email and the password you picked in Step 5, and sign in. You should land
straight on /admin (or /onboarding if that account has no business linked
yet) with no loop.

The plain email-link sign-in still works exactly as before for any
account that hasn't had a password set — nothing about that path changed.
