-- Add orientation (for Shorts: PORTRAIT | LANDSCAPE) and image_urls (multi-image posts)
ALTER TABLE "content"
  ADD COLUMN IF NOT EXISTS "orientation" TEXT,
  ADD COLUMN IF NOT EXISTS "image_urls"  TEXT[] NOT NULL DEFAULT '{}';
