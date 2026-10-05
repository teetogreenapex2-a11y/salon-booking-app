-- Additive only: one nullable column. Nothing existing is changed or dropped.
ALTER TABLE "Business" ADD COLUMN "setupAnswers" JSONB;
