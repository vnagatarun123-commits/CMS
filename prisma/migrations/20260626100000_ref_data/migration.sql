-- Migration: 20260626100000_ref_data
-- Adds per-org reference tables: categories, locations, languages
-- Includes prisma_app GRANT extensions + RLS (permissive + restrictive per table)

-- ── Categories ────────────────────────────────────────────────────────────────

CREATE TABLE "categories" (
  "id"              TEXT         NOT NULL,
  "organization_id" TEXT         NOT NULL,
  "code"            TEXT         NOT NULL,  -- short code e.g. LOC, SPT
  "name"            TEXT         NOT NULL,
  "slug"            TEXT         NOT NULL,
  "active"          BOOLEAN      NOT NULL DEFAULT TRUE,
  "deleted_at"      TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_org_code_unique" UNIQUE ("organization_id", "code"),
  CONSTRAINT "categories_org_slug_unique" UNIQUE ("organization_id", "slug"),
  CONSTRAINT "categories_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX "categories_organization_id_idx" ON "categories"("organization_id");

-- ── Locations ─────────────────────────────────────────────────────────────────
-- Hierarchical: STATE → DISTRICT → MANDAL → VILLAGE
-- parent_id is NULL for STATE level.

CREATE TABLE "locations" (
  "id"              TEXT         NOT NULL,
  "organization_id" TEXT         NOT NULL,
  "name"            TEXT         NOT NULL,
  "slug"            TEXT         NOT NULL,
  "level"           TEXT         NOT NULL,  -- STATE | DISTRICT | MANDAL | VILLAGE
  "parent_id"       TEXT,
  "active"          BOOLEAN      NOT NULL DEFAULT TRUE,
  "deleted_at"      TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "locations_org_level_slug_unique" UNIQUE ("organization_id", "level", "slug"),
  CONSTRAINT "locations_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "locations_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE SET NULL
);

CREATE INDEX "locations_organization_id_idx"       ON "locations"("organization_id");
CREATE INDEX "locations_organization_id_level_idx" ON "locations"("organization_id", "level");
CREATE INDEX "locations_parent_id_idx"             ON "locations"("parent_id");

-- ── Languages ─────────────────────────────────────────────────────────────────

CREATE TABLE "languages" (
  "id"              TEXT         NOT NULL,
  "organization_id" TEXT         NOT NULL,
  "code"            TEXT         NOT NULL,  -- ISO 639-1 e.g. en, te, hi
  "name"            TEXT         NOT NULL,
  "slug"            TEXT         NOT NULL,
  "active"          BOOLEAN      NOT NULL DEFAULT TRUE,
  "deleted_at"      TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "languages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "languages_org_code_unique" UNIQUE ("organization_id", "code"),
  CONSTRAINT "languages_org_slug_unique" UNIQUE ("organization_id", "slug"),
  CONSTRAINT "languages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX "languages_organization_id_idx" ON "languages"("organization_id");

-- ── Grant new tables to prisma_app ────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON "categories" TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "locations"  TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "languages"  TO prisma_app;

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "languages"  ENABLE ROW LEVEL SECURITY;

-- Categories: permissive baseline (required — restrictive-only = no rows)
CREATE POLICY "categories_prisma_app_access"
  ON "categories" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- Categories: restrictive org cap
CREATE POLICY "categories_org_isolation"
  ON "categories" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', TRUE))
  WITH CHECK (organization_id = current_setting('app.organization_id', TRUE));

-- Locations: permissive baseline
CREATE POLICY "locations_prisma_app_access"
  ON "locations" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- Locations: restrictive org cap
CREATE POLICY "locations_org_isolation"
  ON "locations" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', TRUE))
  WITH CHECK (organization_id = current_setting('app.organization_id', TRUE));

-- Languages: permissive baseline
CREATE POLICY "languages_prisma_app_access"
  ON "languages" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- Languages: restrictive org cap
CREATE POLICY "languages_org_isolation"
  ON "languages" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', TRUE))
  WITH CHECK (organization_id = current_setting('app.organization_id', TRUE));
