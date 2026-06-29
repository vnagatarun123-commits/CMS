-- =============================================================================
-- Migration: 20260626000000_init
-- Hand-written to match Prisma 7.x PostgreSQL output for schema.prisma.
-- Also creates the prisma_app NOLOGIN role and RESTRICTIVE RLS policies so
-- tenant isolation is enforced at the DB layer (Path B, per CLAUDE.md §3).
-- =============================================================================

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "invited_at" TIMESTAMP(3) NOT NULL,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assigned_by_id" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_organization_id_idx" ON "profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_user_id_organization_id_key" ON "role_assignments"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "role_assignments_organization_id_idx" ON "role_assignments"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- RLS — prisma_app role + RESTRICTIVE tenant-isolation policies
-- These run after table creation so GRANTs have objects to target.
-- =============================================================================

-- CreateRole: prisma_app (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'prisma_app') THEN
    CREATE ROLE prisma_app NOLOGIN;
  END IF;
END
$$;

-- GrantSchema
GRANT USAGE ON SCHEMA public TO prisma_app;

-- GrantTableAccess
GRANT SELECT, INSERT, UPDATE, DELETE ON "organizations"    TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "profiles"         TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "role_assignments" TO prisma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "audit_logs"       TO prisma_app;

-- AlterDefaultPrivileges: future tables created by postgres also grant to prisma_app
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO prisma_app;

-- EnableRLS
ALTER TABLE "organizations"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"       ENABLE ROW LEVEL SECURITY;

-- CreatePolicy: Two-layer RLS for prisma_app on every tenant table.
--
-- PostgreSQL requires at least one PERMISSIVE policy for rows to be visible;
-- RESTRICTIVE-only gives no access to any rows.  We therefore use both:
--
--   1. PERMISSIVE baseline (USING TRUE) — grants prisma_app read/write access.
--   2. RESTRICTIVE org-isolation cap    — hard-limits every query to the org
--      whose ID was set via set_config('app.organization_id', ..., true).
--
-- The net USING check per row is: TRUE AND (col = setting) = (col = setting).
-- If app.organization_id is unset, current_setting returns NULL, the comparison
-- evaluates to NULL (not TRUE), and all rows are denied — no accidental leak.

-- Permissive baselines
CREATE POLICY "organizations_prisma_app_access"
  ON "organizations" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "profiles_prisma_app_access"
  ON "profiles" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "role_assignments_prisma_app_access"
  ON "role_assignments" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "audit_logs_prisma_app_access"
  ON "audit_logs" AS PERMISSIVE TO prisma_app
  USING (TRUE) WITH CHECK (TRUE);

-- Restrictive org-isolation caps
CREATE POLICY "organizations_org_isolation"
  ON "organizations" AS RESTRICTIVE TO prisma_app
  USING (id = current_setting('app.organization_id', true))
  WITH CHECK (id = current_setting('app.organization_id', true));

CREATE POLICY "profiles_org_isolation"
  ON "profiles" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE POLICY "role_assignments_org_isolation"
  ON "role_assignments" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE POLICY "audit_logs_org_isolation"
  ON "audit_logs" AS RESTRICTIVE TO prisma_app
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));
