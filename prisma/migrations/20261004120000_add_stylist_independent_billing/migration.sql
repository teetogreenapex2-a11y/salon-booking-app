-- AlterTable
ALTER TABLE "Stylist" ADD COLUMN "independentPayouts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stylist" ADD COLUMN "stripeConnectedAccountId" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stylist" ADD COLUMN "independentBilling" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stylist" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Stylist_stripeConnectedAccountId_key" ON "Stylist"("stripeConnectedAccountId");
CREATE UNIQUE INDEX "Stylist_stripeCustomerId_key" ON "Stylist"("stripeCustomerId");
CREATE UNIQUE INDEX "Stylist_stripeSubscriptionId_key" ON "Stylist"("stripeSubscriptionId");
