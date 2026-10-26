-- AlterTable
ALTER TABLE "Service" ADD COLUMN "depositCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "depositCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "depositPaymentIntentId" TEXT,
ADD COLUMN "depositRefundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_depositPaymentIntentId_key" ON "Booking"("depositPaymentIntentId");

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "depositsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Stylist" ADD COLUMN "depositsEnabled" BOOLEAN NOT NULL DEFAULT true;
