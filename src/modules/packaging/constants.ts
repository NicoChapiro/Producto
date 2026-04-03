export const REQUEST_TYPES = ['nueva', 'cambio', 'correccion', 'adaptacion', 'reimpresion', 'urgencia'] as const;
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
  'cancelado'
] as const;
