ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stylistId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_stylistId_idx" ON "Product"("stylistId");
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
