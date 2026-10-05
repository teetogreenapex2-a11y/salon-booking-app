-- Additive only: optional payment handles on Stylist, and a paid-outside
-- record on Booking. Nothing existing is changed or dropped.
ALTER TABLE "Stylist" ADD COLUMN "venmoHandle" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "cashAppHandle" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "zelleInfo" TEXT;

ALTER TABLE "Booking" ADD COLUMN "paidOutsideAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paidOutsideMethod" TEXT;
