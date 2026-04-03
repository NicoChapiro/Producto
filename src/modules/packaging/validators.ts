import { ApprovalStage, ApprovalStatus, ChecklistItemStatus, PackagingRequestPriority, PackagingRequestStatus, PackagingRequestType, RequestFileType } from '@prisma/client';
import { ValidationError } from './errors';

const requestTypes = new Set<PackagingRequestType>(['nueva', 'cambio', 'correccion', 'adaptacion', 'reimpresion', 'urgencia']);
const priorities = new Set<PackagingRequestPriority>(['baja', 'media', 'alta', 'urgente']);
const requestStatuses = new Set<PackagingRequestStatus>([
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
]);
const checklistStatuses = new Set<ChecklistItemStatus>(['pendiente', 'en_proceso', 'completado', 'rechazado', 'no_aplica']);
const approvalStages = new Set<ApprovalStage>(['diseno', 'calidad', 'producto']);
const approvalStatuses = new Set<ApprovalStatus>(['pendiente', 'aprobado', 'rechazado']);
const fileTypes = new Set<RequestFileType>(['brief', 'originales', 'propuesta', 'correccion', 'final']);

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(message);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`Field "${field}" is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid string field.');
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !value) {
    throw new ValidationError(`Field "${field}" must be a date string.`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`Field "${field}" must be a valid date.`);
  }
  return parsed;
}

export function validateCreateRequestPayload(payload: unknown) {
  const body = asObject(payload, 'Invalid payload for request creation.');
  const requestType = requiredString(body.requestType, 'requestType') as PackagingRequestType;
  const priority = requiredString(body.priority, 'priority') as PackagingRequestPriority;

  if (!requestTypes.has(requestType)) throw new ValidationError('Invalid requestType.');
  if (!priorities.has(priority)) throw new ValidationError('Invalid priority.');

  const rawAssignees = body.assignees;
  const assignees =
    rawAssignees === undefined
      ? []
      : Array.isArray(rawAssignees)
        ? rawAssignees.map((value) => {
            const item = asObject(value, 'Invalid assignee entry.');
            return {
              assigneeName: requiredString(item.assigneeName, 'assigneeName'),
              role: optionalString(item.role)
            };
          })
        : (() => {
            throw new ValidationError('assignees must be an array.');
          })();

  return {
    title: requiredString(body.title, 'title'),
    requestType,
    brand: requiredString(body.brand, 'brand'),
    category: requiredString(body.category, 'category'),
    productName: requiredString(body.productName, 'productName'),
    projectName: optionalString(body.projectName),
    internalCode: optionalString(body.internalCode),
    sku: optionalString(body.sku),
    ean: optionalString(body.ean),
    dun: optionalString(body.dun),
    requesterName: requiredString(body.requesterName, 'requesterName'),
    designOwnerName: requiredString(body.designOwnerName, 'designOwnerName'),
    productOwnerName: requiredString(body.productOwnerName, 'productOwnerName'),
    requestDate: parseDate(body.requestDate, 'requestDate'),
    dueDate: parseDate(body.dueDate, 'dueDate'),
    priority,
    generalComments: optionalString(body.generalComments),
    sharepointFolderUrl: optionalString(body.sharepointFolderUrl),
    assignees,
    actor: optionalString(body.actor)
  };
}

export function validateUpdateRequestPayload(payload: unknown) {
  const body = asObject(payload, 'Invalid payload for request update.');
  const output: Record<string, unknown> = {};

  if ('title' in body) output.title = requiredString(body.title, 'title');
  if ('brand' in body) output.brand = requiredString(body.brand, 'brand');
  if ('category' in body) output.category = requiredString(body.category, 'category');
  if ('productName' in body) output.productName = requiredString(body.productName, 'productName');
  if ('projectName' in body) output.projectName = optionalString(body.projectName);
  if ('internalCode' in body) output.internalCode = optionalString(body.internalCode);
  if ('sku' in body) output.sku = optionalString(body.sku);
  if ('ean' in body) output.ean = optionalString(body.ean);
  if ('dun' in body) output.dun = optionalString(body.dun);
  if ('requesterName' in body) output.requesterName = requiredString(body.requesterName, 'requesterName');
  if ('designOwnerName' in body) output.designOwnerName = requiredString(body.designOwnerName, 'designOwnerName');
  if ('productOwnerName' in body) output.productOwnerName = requiredString(body.productOwnerName, 'productOwnerName');
  if ('generalComments' in body) output.generalComments = optionalString(body.generalComments);
  if ('sharepointFolderUrl' in body) output.sharepointFolderUrl = optionalString(body.sharepointFolderUrl);
  if ('actor' in body) output.actor = optionalString(body.actor);
  if ('dueDate' in body) output.dueDate = parseDate(body.dueDate, 'dueDate');
  if ('status' in body) {
    const status = requiredString(body.status, 'status') as PackagingRequestStatus;
    if (!requestStatuses.has(status)) throw new ValidationError('Invalid status.');
    output.status = status;
  }

  return output;
}

export function validateChecklistPayload(payload: unknown) {
  const body = asObject(payload, 'Invalid payload for checklist update.');
  const status = requiredString(body.status, 'status') as ChecklistItemStatus;
  if (!checklistStatuses.has(status)) throw new ValidationError('Invalid checklist status.');

  const checklistItemId = requiredString(body.checklistItemId, 'checklistItemId');
  const relatedFileTypeRaw = optionalString(body.relatedFileType);
  const relatedFileType = relatedFileTypeRaw as RequestFileType | undefined;
  if (relatedFileType && !fileTypes.has(relatedFileType)) {
    throw new ValidationError('Invalid relatedFileType.');
  }

  return {
    checklistItemId,
    status,
    responsibleName: optionalString(body.responsibleName),
    comment: optionalString(body.comment),
    relatedFileType,
    actor: optionalString(body.actor)
  };
}

export function validateApprovalPayload(payload: unknown) {
  const body = asObject(payload, 'Invalid payload for approval update.');
  const stage = requiredString(body.stage, 'stage') as ApprovalStage;
  const status = requiredString(body.status, 'status') as ApprovalStatus;

  if (!approvalStages.has(stage)) throw new ValidationError('Invalid approval stage.');
  if (!approvalStatuses.has(status)) throw new ValidationError('Invalid approval status.');

  return {
    stage,
    status,
    comment: optionalString(body.comment),
    actor: optionalString(body.actor)
  };
}

export function validateFileLinkPayload(payload: unknown) {
  const body = asObject(payload, 'Invalid payload for file-link creation.');
  const fileType = requiredString(body.fileType, 'fileType') as RequestFileType;
  if (!fileTypes.has(fileType)) throw new ValidationError('Invalid fileType.');

  const url = requiredString(body.url, 'url');
  if (!/^https?:\/\//i.test(url)) {
    throw new ValidationError('Field "url" must be an http/https URL.');
  }

  return {
    fileType,
    label: requiredString(body.label, 'label'),
    url,
    versionLabel: optionalString(body.versionLabel),
    uploadedBy: optionalString(body.uploadedBy),
    actor: optionalString(body.actor)
  };
}
