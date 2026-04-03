export const REQUEST_TYPES = [
  'nueva',
  'cambio',
  'correccion',
  'adaptacion',
  'reimpresion',
  'urgencia',
  'nuevo_producto',
  'cambio_actualizacion',
  'correccion_post_original'
] as const;

export const PRIORITIES = ['baja', 'media', 'alta', 'urgente'] as const;

export const STATUSES = [
  'solicitud_ingresada',
  'en_revision',
  'en_proceso',
  'propuesta_enviada',
  'ajustes_correcciones',
  'aprobacion_diseno',
  'aprobacion_calidad',
  'aprobacion_producto',
  'enviado_final',
  'cerrado',
  'rechazado',
  'cancelado',
  'solicitud_creada',
  'pendiente_insumos',
  'lista_para_diseno',
  'recepcionada_por_diseno',
  'en_diseno',
  'revision_interna_diseno',
  'en_observaciones_correcciones',
  'lista_para_aprobaciones_finales',
  'aprobacion_final_jefe_diseno',
  'aprobacion_solicitante',
  'aprobacion_jefatura_producto',
  'original_final_subido',
  'recepcionado_por_producto',
  'enviado_a_proveedor',
  'observaciones_proveedor',
  'prueba_color_digital',
  'prueba_color_fisica',
  'completo',
  'urgencia_en_curso',
  'reabierto_post_proveedor'
] as const;

export const ROUND_DECISIONS = ['aprobado', 'aprobado_con_observaciones_menores', 'con_cambios', 'rechazado'] as const;
export const ROUND_RESULTS = ['aprobada', 'aprobada_con_observaciones_menores', 'con_cambios', 'rechazada'] as const;
export const ROUND_STATUSES = ['abierta', 'cerrada'] as const;
