-- AlterTable
ALTER TABLE "Business" ADD COLUMN "quickStart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "servicesReviewedAt" TIMESTAMP(3);
