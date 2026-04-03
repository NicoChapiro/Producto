import { DesignRoundDecision, DesignRoundResult, PackagingRequestStatus, PackagingRequestType } from '@prisma/client';

export type TransitionContext = {
  from: PackagingRequestStatus;
  to: PackagingRequestStatus;
};

const ANY_TIME_STATUSES = new Set<PackagingRequestStatus>(['cancelado']);

const ALLOWED_TRANSITIONS: Record<PackagingRequestStatus, PackagingRequestStatus[]> = {
  // Legacy
  solicitud_ingresada: ['en_revision', 'cancelado'],
  en_revision: ['en_proceso', 'ajustes_correcciones', 'cancelado'],
  en_proceso: ['propuesta_enviada', 'ajustes_correcciones', 'cancelado'],
  propuesta_enviada: ['aprobacion_diseno', 'ajustes_correcciones', 'cancelado'],
  ajustes_correcciones: ['en_proceso', 'propuesta_enviada', 'cancelado'],
  aprobacion_diseno: ['aprobacion_calidad', 'ajustes_correcciones', 'cancelado'],
  aprobacion_calidad: ['aprobacion_producto', 'ajustes_correcciones', 'cancelado'],
  aprobacion_producto: ['enviado_final', 'ajustes_correcciones', 'cancelado'],
  enviado_final: ['cerrado', 'cancelado'],
  cerrado: [],
  rechazado: ['ajustes_correcciones', 'cancelado'],
  cancelado: [],

  // V2
  solicitud_creada: ['pendiente_insumos', 'lista_para_diseno', 'cancelado', 'urgencia_en_curso'],
  pendiente_insumos: ['lista_para_diseno', 'cancelado', 'urgencia_en_curso'],
  lista_para_diseno: ['recepcionada_por_diseno', 'cancelado', 'urgencia_en_curso'],
  recepcionada_por_diseno: ['en_diseno', 'cancelado', 'urgencia_en_curso'],
  en_diseno: ['revision_interna_diseno', 'en_observaciones_correcciones', 'cancelado', 'urgencia_en_curso'],
  revision_interna_diseno: ['propuesta_enviada', 'en_observaciones_correcciones', 'cancelado', 'urgencia_en_curso'],
  en_observaciones_correcciones: ['en_diseno', 'lista_para_aprobaciones_finales', 'cancelado', 'urgencia_en_curso'],
  lista_para_aprobaciones_finales: ['aprobacion_final_jefe_diseno', 'cancelado', 'urgencia_en_curso'],
  aprobacion_final_jefe_diseno: ['aprobacion_solicitante', 'en_observaciones_correcciones', 'cancelado', 'urgencia_en_curso'],
  aprobacion_solicitante: ['aprobacion_jefatura_producto', 'en_observaciones_correcciones', 'cancelado', 'urgencia_en_curso'],
  aprobacion_jefatura_producto: ['original_final_subido', 'en_observaciones_correcciones', 'cancelado', 'urgencia_en_curso'],
  original_final_subido: ['recepcionado_por_producto', 'cancelado', 'urgencia_en_curso'],
  recepcionado_por_producto: ['enviado_a_proveedor', 'completo', 'cancelado', 'urgencia_en_curso'],
  enviado_a_proveedor: ['observaciones_proveedor', 'prueba_color_digital', 'prueba_color_fisica', 'completo', 'cancelado'],
  observaciones_proveedor: ['en_observaciones_correcciones', 'prueba_color_digital', 'prueba_color_fisica', 'cancelado'],
  prueba_color_digital: ['prueba_color_fisica', 'completo', 'observaciones_proveedor', 'cancelado'],
  prueba_color_fisica: ['completo', 'observaciones_proveedor', 'cancelado'],
  completo: ['cerrado', 'reabierto_post_proveedor', 'cancelado'],
  urgencia_en_curso: ['lista_para_diseno', 'en_diseno', 'propuesta_enviada', 'cancelado'],
  reabierto_post_proveedor: ['en_observaciones_correcciones', 'enviado_a_proveedor', 'cancelado']
};

export function isAllowedStatusTransition({ from, to }: TransitionContext): boolean {
  if (from === to) return true;
  if (ANY_TIME_STATUSES.has(to)) return true;
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

export function computeRoundResult(productDecision: DesignRoundDecision, qualityDecision: DesignRoundDecision): DesignRoundResult {
  if (productDecision === 'rechazado' || qualityDecision === 'rechazado') return 'rechazada';
  if (productDecision === 'con_cambios' || qualityDecision === 'con_cambios') return 'con_cambios';
  if (productDecision === 'aprobado_con_observaciones_menores' || qualityDecision === 'aprobado_con_observaciones_menores') {
    return 'aprobada_con_observaciones_menores';
  }
  return 'aprobada';
}

export function canCloseRound(productDecision?: DesignRoundDecision | null, qualityDecision?: DesignRoundDecision | null) {
  return Boolean(productDecision && qualityDecision);
}

export function canMoveToFinalApprovals(roundResult?: DesignRoundResult | null, minorObservationsResolved?: boolean) {
  if (roundResult === 'aprobada') return true;
  if (roundResult === 'aprobada_con_observaciones_menores' && minorObservationsResolved) return true;
  return false;
}

export function requiresStrictInputGate(requestType: PackagingRequestType) {
  return requestType === 'nuevo_producto' || requestType === 'nueva';
}
