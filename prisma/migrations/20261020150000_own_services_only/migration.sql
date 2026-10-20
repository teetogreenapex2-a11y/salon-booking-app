ALTER TABLE "Stylist" ADD COLUMN "ownServicesOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN "ownerStylistId" TEXT;
