-- AlterTable
ALTER TABLE "Stylist" ADD COLUMN "canEditOwnPricing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Stylist" ADD COLUMN "canEditOwnHours" BOOLEAN NOT NULL DEFAULT true;
