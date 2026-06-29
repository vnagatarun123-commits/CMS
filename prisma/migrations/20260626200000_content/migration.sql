-- Migration: 20260626200000_content
-- Adds content and content_transitions tables with RLS

-- ── Content ───────────────────────────────────────────────────────────────────

CREATE TABLE "content" (
  "id"              TEXT         NOT NULL,
  "organization_id" TEXT         NOT NULL,
  "type"            TEXT         NOT NULL,
  "status"          TEXT         NOT NULL,
  "source"          TEXT         NOT NULL,
  "title"           TEXT         NOT NULL,
  "slug"            TEXT         NOT NULL,
  "body"            TEXT,
  "excerpt"         TEXT,
  "media_url"       TEXT,
  "youtube_url"     TEXT,
  "category_id"     TEXT,
  "location_id"     TEXT,
  "language_id"     TEXT,
  "reporter_id"     TEXT,
  "scheduled_at"    TIMESTAMPTZ,
  "published_at"    TIMESTAMPTZ,
  "deleted_at"      TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "content_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "content_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
  CONSTRAINT "content_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL,
  CONSTRAINT "content_language_id_fkey"
    FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE SET NULL,
  CONSTRAINT "content_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE SET NULL
);

CREATE INDEX "content_organization_id_idx"        ON "content"("organization_id");
CREATE INDEX "content_org_status_idx"             ON "content"("organization_id", "status");
CREATE INDEX "content_org_type_idx"               ON "content"("organization_id", "type");

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON "content"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ContentTransitions ────────────────────────────────────────────────────────

CREATE TABLE "content_transitions" (
  "id"          TEXT         NOT NULL,
  "content_id"  TEXT         NOT NULL,
  "from_status" TEXT,
  "to_status"   TEXT         NOT NULL,
  "actor_id"    TEXT         NOT NULL,
  "actor_name"  TEXT         NOT NULL,
  "note"        TEXT,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "content_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_transitions_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE
);

CREATE INDEX "content_transitions_content_id_idx" ON "content_transitions"("content_id");

-- ── Grant to prisma_app ───────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON "content"             TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "content_transitions" TO prisma_app;

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE "content"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_transitions" ENABLE ROW LEVEL SECURITY;

-- content: permissive baseline
CREATE POLICY "content_prisma_app_access"
  ON "content" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- content: restrictive org cap
CREATE POLICY "content_org_isolation"
  ON "content" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', TRUE))
  WITH CHECK (organization_id = current_setting('app.organization_id', TRUE));

-- content_transitions: permissive baseline
-- (transitions are scoped via content_id FK; org context still set for defense)
CREATE POLICY "content_transitions_prisma_app_access"
  ON "content_transitions" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- content_transitions: no cross-org reads (join-guarded by content RLS)
CREATE POLICY "content_transitions_org_isolation"
  ON "content_transitions" AS RESTRICTIVE TO prisma_app
  USING (
    EXISTS (
      SELECT 1 FROM "content" c
      WHERE c.id = content_id
        AND c.organization_id = current_setting('app.organization_id', TRUE)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "content" c
      WHERE c.id = content_id
        AND c.organization_id = current_setting('app.organization_id', TRUE)
    )
  );
