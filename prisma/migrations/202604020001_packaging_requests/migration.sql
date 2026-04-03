-- Create enums
CREATE TYPE "PackagingRequestType" AS ENUM ('nueva', 'cambio', 'correccion', 'adaptacion', 'reimpresion', 'urgencia');
CREATE TYPE "PackagingRequestPriority" AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE "PackagingRequestStatus" AS ENUM ('solicitud_ingresada', 'en_revision', 'en_proceso', 'propuesta_enviada', 'ajustes_correcciones', 'aprobacion_diseno', 'aprobacion_calidad', 'aprobacion_producto', 'enviado_final', 'cerrado', 'rechazado', 'cancelado');
CREATE TYPE "PackagingTrafficLight" AS ENUM ('verde', 'amarillo', 'rojo', 'gris');
CREATE TYPE "ChecklistItemStatus" AS ENUM ('pendiente', 'en_proceso', 'completado', 'rechazado', 'no_aplica');
CREATE TYPE "ApprovalStage" AS ENUM ('diseno', 'calidad', 'producto');
CREATE TYPE "ApprovalStatus" AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE "RequestFileType" AS ENUM ('brief', 'originales', 'propuesta', 'correccion', 'final');

CREATE TABLE "packaging_requests" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "request_type" "PackagingRequestType" NOT NULL,
  "brand" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "project_name" TEXT,
  "internal_code" TEXT,
  "sku" TEXT,
  "ean" TEXT,
  "dun" TEXT,
  "requester_name" TEXT NOT NULL,
  "design_owner_name" TEXT NOT NULL,
  "product_owner_name" TEXT NOT NULL,
  "priority" "PackagingRequestPriority" NOT NULL,
  "status" "PackagingRequestStatus" NOT NULL,
  "request_date" TIMESTAMP(3) NOT NULL,
  "brief_date" TIMESTAMP(3),
  "proposal_date" TIMESTAMP(3),
  "correction_date" TIMESTAMP(3),
  "final_date" TIMESTAMP(3),
  "due_date" TIMESTAMP(3) NOT NULL,
  "traffic_light" "PackagingTrafficLight" NOT NULL,
  "general_comments" TEXT,
  "sharepoint_folder_url" TEXT,
  "is_closed" BOOLEAN NOT NULL DEFAULT false,
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "packaging_request_assignees" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "packaging_requests"("id") ON DELETE CASCADE,
  "assignee_name" TEXT NOT NULL,
  "role" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "checklist_templates" (
  "id" TEXT PRIMARY KEY,
  "request_type" "PackagingRequestType" NOT NULL,
  "item_name" TEXT NOT NULL,
  "item_order" INTEGER NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "default_responsible_role" TEXT,
  UNIQUE ("request_type", "item_name")
);

CREATE TABLE "checklist_items" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "packaging_requests"("id") ON DELETE CASCADE,
  "template_item_name" TEXT NOT NULL,
  "status" "ChecklistItemStatus" NOT NULL DEFAULT 'pendiente',
  "responsible_name" TEXT,
  "completed_at" TIMESTAMP(3),
  "comment" TEXT,
  "related_file_type" "RequestFileType",
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "request_approvals" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "packaging_requests"("id") ON DELETE CASCADE,
  "approval_stage" "ApprovalStage" NOT NULL,
  "approver_name" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'pendiente',
  "comment" TEXT,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("request_id", "approval_stage")
);

CREATE TABLE "request_file_links" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "packaging_requests"("id") ON DELETE CASCADE,
  "file_type" "RequestFileType" NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "version_label" TEXT,
  "uploaded_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "diff_json" JSONB,
  "actor" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "packaging_requests_status_idx" ON "packaging_requests" ("status");
CREATE INDEX "packaging_requests_priority_idx" ON "packaging_requests" ("priority");
CREATE INDEX "packaging_requests_request_type_idx" ON "packaging_requests" ("request_type");
CREATE INDEX "packaging_requests_due_date_idx" ON "packaging_requests" ("due_date");
CREATE INDEX "checklist_items_request_id_idx" ON "checklist_items" ("request_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs" ("entity_type", "entity_id");
