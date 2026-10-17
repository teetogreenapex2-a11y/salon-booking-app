ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;
ALTER TABLE "Service" ADD COLUMN "barcode" TEXT;
CREATE UNIQUE INDEX "Product_businessId_barcode_key" ON "Product"("businessId", "barcode");
CREATE UNIQUE INDEX "Service_businessId_barcode_key" ON "Service"("businessId", "barcode");

CREATE TABLE "BookingExtra" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingExtra_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BookingExtra_bookingId_idx" ON "BookingExtra"("bookingId");
ALTER TABLE "BookingExtra" ADD CONSTRAINT "BookingExtra_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingExtra" ADD CONSTRAINT "BookingExtra_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
