-- CreateTable
CREATE TABLE "CustomerCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCard_customerId_connectedAccountId_key" ON "CustomerCard"("customerId", "connectedAccountId");

-- AddForeignKey
ALTER TABLE "CustomerCard" ADD CONSTRAINT "CustomerCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every customer who already has a card saved today only ever
-- had it saved under their own salon's connected Stripe account (per-
-- stylist payouts didn't exist yet), so this carries those forward as-is
-- with no re-entering a card required. New cards from here on are written
-- straight to CustomerCard — see /api/bookings/card-setup.
INSERT INTO "CustomerCard" ("id", "customerId", "connectedAccountId", "stripeCustomerId", "stripePaymentMethodId", "createdAt", "updatedAt")
SELECT
    substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 25),
    c."id",
    b."stripeConnectedAccountId",
    c."stripeCustomerId",
    c."stripePaymentMethodId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Customer" c
JOIN "Business" b ON b."id" = c."businessId"
WHERE c."stripeCustomerId" IS NOT NULL
  AND b."stripeConnectedAccountId" IS NOT NULL;
