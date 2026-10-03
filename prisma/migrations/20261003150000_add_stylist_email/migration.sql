-- AlterTable
ALTER TABLE "Stylist" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Stylist_email_key" ON "Stylist"("email");
