-- Extend request type enum for v2
ALTER TYPE "PackagingRequestType" ADD VALUE IF NOT EXISTS 'nuevo_producto';
ALTER TYPE "PackagingRequestType" ADD VALUE IF NOT EXISTS 'cambio_actualizacion';
ALTER TYPE "PackagingRequestType" ADD VALUE IF NOT EXISTS 'correccion_post_original';

-- Extend status enum for v2 flow
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'solicitud_creada';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'pendiente_insumos';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'lista_para_diseno';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'recepcionada_por_diseno';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'en_diseno';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'revision_interna_diseno';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'en_observaciones_correcciones';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'lista_para_aprobaciones_finales';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'aprobacion_final_jefe_diseno';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'aprobacion_solicitante';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'aprobacion_jefatura_producto';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'original_final_subido';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'recepcionado_por_producto';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'enviado_a_proveedor';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'observaciones_proveedor';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'prueba_color_digital';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'prueba_color_fisica';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'completo';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'urgencia_en_curso';
ALTER TYPE "PackagingRequestStatus" ADD VALUE IF NOT EXISTS 'reabierto_post_proveedor';

-- Request milestone columns for v2
ALTER TABLE "packaging_requests"
  ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "received_by_product_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "received_by_product_name" TEXT,
  ADD COLUMN IF NOT EXISTS "sent_to_supplier_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sent_to_supplier_by" TEXT,
  ADD COLUMN IF NOT EXISTS "sent_to_supplier_comment" TEXT,
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rounds_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "requires_supplier_flow" BOOLEAN NOT NULL DEFAULT false;

-- New enums for design rounds
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesignRoundStatus') THEN
    CREATE TYPE "DesignRoundStatus" AS ENUM ('abierta', 'cerrada');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesignRoundDecision') THEN
    CREATE TYPE "DesignRoundDecision" AS ENUM ('aprobado', 'aprobado_con_observaciones_menores', 'con_cambios', 'rechazado');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesignRoundResult') THEN
    CREATE TYPE "DesignRoundResult" AS ENUM ('aprobada', 'aprobada_con_observaciones_menores', 'con_cambios', 'rechazada');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "packaging_design_rounds" (
  "id" TEXT PRIMARY KEY,
  "request_id" TEXT NOT NULL REFERENCES "packaging_requests"("id") ON DELETE CASCADE,
  "round_number" INTEGER NOT NULL,
  "status" "DesignRoundStatus" NOT NULL DEFAULT 'abierta',
  "proposal_url" TEXT,
  "design_comment" TEXT,
  "product_comment" TEXT,
  "quality_comment" TEXT,
  "product_decision" "DesignRoundDecision",
  "quality_decision" "DesignRoundDecision",
  "round_result" "DesignRoundResult",
  "minor_observations_resolved" BOOLEAN NOT NULL DEFAULT false,
  "sent_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("request_id", "round_number")
);

CREATE INDEX IF NOT EXISTS "packaging_design_rounds_request_id_idx" ON "packaging_design_rounds" ("request_id");
