-- Add content flags: tags array, breaking_news, trending, featured
ALTER TABLE "content"
  ADD COLUMN IF NOT EXISTS "tags"             TEXT[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "is_breaking_news" BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "is_trending"      BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "is_featured"      BOOLEAN      NOT NULL DEFAULT FALSE;
