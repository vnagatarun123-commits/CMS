-- Add thumbnail_url column to content table
ALTER TABLE "content"
  ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;
