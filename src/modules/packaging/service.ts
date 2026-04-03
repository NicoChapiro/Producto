import {
  ApprovalStage,
  ApprovalStatus,
  PackagingRequestStatus
} from '@prisma/client';
import { computeTrafficLight } from './traffic-light';
import {
  AddFileLinkInput,
  CreateDesignRoundInput,
  CreatePackagingRequestInput,
  DEFAULT_APPROVERS,
  UpdateApprovalInput,
  UpdateChecklistItemInput,
  UpdateDesignRoundInput,
  UpdatePackagingRequestInput
} from './types';
import { packagingRepository, prisma } from './repository';
import { ConflictError, NotFoundError } from './errors';
import {
  canCloseRound,
  canMoveToFinalApprovals,
  computeRoundResult,
  isAllowedStatusTransition,
  requiresStrictInputGate
} from './flow-rules';

function nextCodeFrom(lastCode?: string) {
  const current = Number(lastCode?.split('-')[1] ?? 0) + 1;
  return `SOL-${String(current).padStart(4, '0')}`;
}

async function logAudit(entityType: 'packaging_request' | 'packaging_design_round', entityId: string, action: string, actor = 'system', diffJson?: unknown) {
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actor,
      diffJson: diffJson ? (diffJson as object) : undefined
    }
  });
}

async function assertStatusTransition(requestId: string, nextStatus: PackagingRequestStatus) {
  const request = await prisma.packagingRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError('Solicitud no encontrada.');

  if (!isAllowedStatusTransition({ from: request.status, to: nextStatus })) {
    throw new ConflictError(`Transición no permitida: ${request.status} -> ${nextStatus}.`);
  }

  if (nextStatus === 'aprobacion_calidad') {
    const diseno = await packagingRepository.getApproval(requestId, 'diseno');
    if (!diseno || diseno.status !== 'aprobado') {
      throw new ConflictError('No se puede pasar a aprobacion_calidad sin aprobación de diseño.');
    }
  }

  if (nextStatus === 'aprobacion_producto') {
    const calidad = await packagingRepository.getApproval(requestId, 'calidad');
    if (!calidad || calidad.status !== 'aprobado') {
      throw new ConflictError('No se puede pasar a aprobacion_producto sin aprobación de calidad.');
    }
  }

  if (nextStatus === 'lista_para_diseno' && requiresStrictInputGate(request.requestType)) {
    const inputSignals = await packagingRepository.getInputReadinessSignals(requestId);
    const checklistItems = inputSignals?.checklistItems ?? [];
    const fileLinks = inputSignals?.fileLinks ?? [];

    const briefReadyFromChecklist = checklistItems.some((item) => item.templateItemName.toLowerCase().includes('brief'));
    const visualReadyFromChecklist = checklistItems.some((item) => item.templateItemName.toLowerCase().includes('referencias visuales'));
    const briefReadyFromFiles = fileLinks.some((file) => file.fileType === 'brief');
    const visualReadyFromFiles = fileLinks.some((file) => ['originales', 'propuesta'].includes(file.fileType));

    const briefReady = briefReadyFromChecklist || briefReadyFromFiles;
    const visualRefsReady = visualReadyFromChecklist || visualReadyFromFiles;

    if (!request.productName?.trim() || !briefReady || !visualRefsReady) {
      throw new ConflictError('Nuevo producto requiere brief completo, nombre y referencias visuales para pasar a lista_para_diseno.');
    }
  }

  if (nextStatus === 'propuesta_enviada') {
    if (!['revision_interna_diseno', 'en_proceso'].includes(request.status)) {
      throw new ConflictError('No se puede pasar a propuesta_enviada sin revisión interna de diseño.');
    }
  }

  if (nextStatus === 'lista_para_aprobaciones_finales') {
    const latestClosed = await packagingRepository.getLatestClosedRound(requestId);
    if (!latestClosed) {
      throw new ConflictError('No se puede pasar a lista_para_aprobaciones_finales sin una ronda cerrada.');
    }

    if (!canMoveToFinalApprovals(latestClosed.roundResult, latestClosed.minorObservationsResolved)) {
      throw new ConflictError('La última ronda no habilita aprobaciones finales.');
    }
  }

  if (nextStatus === 'cerrado') {
    const finalLinks = await prisma.requestFileLink.count({
      where: { requestId, fileType: 'final' }
    });

    if (finalLinks < 1) {
      throw new ConflictError('No se puede cerrar la solicitud sin un archivo final.');
    }
  }
}

export const packagingService = {
  listRequests: packagingRepository.listRequests,

  getRequestDetail(id: string) {
    return packagingRepository.getRequestById(id);
  },

  getRequestHistory(id: string) {
    return packagingRepository.getRequestHistory(id);
  },

  async createRequest(input: CreatePackagingRequestInput) {
    const latestCode = await packagingRepository.getLatestCode();
    const code = nextCodeFrom(latestCode?.code);

    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.packagingRequest.create({
        data: {
          code,
          title: input.title,
          requestType: input.requestType,
          brand: input.brand,
          category: input.category,
          productName: input.productName,
          projectName: input.projectName,
          internalCode: input.internalCode,
          sku: input.sku,
          ean: input.ean,
          dun: input.dun,
          requesterName: input.requesterName,
          designOwnerName: input.designOwnerName,
          productOwnerName: input.productOwnerName,
          requestDate: input.requestDate,
          dueDate: input.dueDate,
          priority: input.priority,
          status: 'solicitud_ingresada',
          trafficLight: computeTrafficLight(input.dueDate, 'solicitud_ingresada', false),
          generalComments: input.generalComments,
          sharepointFolderUrl: input.sharepointFolderUrl,
          assignees: input.assignees?.length
            ? {
                createMany: {
                  data: input.assignees
                }
              }
            : undefined
        }
      });

      const templates = await tx.checklistTemplate.findMany({
        where: { requestType: input.requestType },
        orderBy: { itemOrder: 'asc' }
      });

      if (templates.length) {
        await tx.checklistItem.createMany({
          data: templates.map((template) => ({
            requestId: request.id,
            templateItemName: template.itemName,
            sortOrder: template.itemOrder,
            status: 'pendiente'
          }))
        });
      }

      await tx.requestApproval.createMany({
        data: (Object.keys(DEFAULT_APPROVERS) as ApprovalStage[]).map((stage) => ({
          requestId: request.id,
          approvalStage: stage,
          approverName: DEFAULT_APPROVERS[stage],
          status: 'pendiente'
        }))
      });

      await tx.auditLog.create({
        data: {
          entityType: 'packaging_request',
          entityId: request.id,
          action: 'request_created',
          actor: input.actor ?? input.requesterName,
          diffJson: { code }
        }
      });

      return request;
    });

    return created;
  },

  async updateRequest(id: string, input: UpdatePackagingRequestInput) {
    const current = await prisma.packagingRequest.findUnique({ where: { id } });
    if (!current) throw new NotFoundError('Solicitud no encontrada.');

    if (input.status && input.status !== current.status) {
      await assertStatusTransition(id, input.status);
    }

    const nextStatus = input.status ?? current.status;
    const nextDueDate = input.dueDate ?? current.dueDate;
    const nextIsClosed = nextStatus === 'cerrado' || current.isClosed;

    const updated = await prisma.packagingRequest.update({
      where: { id },
      data: {
        ...input,
        isClosed: nextStatus === 'cerrado' ? true : current.isClosed,
        closedAt: nextStatus === 'cerrado' ? new Date() : current.closedAt,
        trafficLight: computeTrafficLight(nextDueDate, nextStatus, nextIsClosed)
      }
    });

    await logAudit('packaging_request', id, 'request_updated', input.actor, input);

    if (input.status && input.status !== current.status) {
      await logAudit('packaging_request', id, 'status_changed', input.actor, {
        from: current.status,
        to: input.status
      });
    }

    if (input.dueDate && input.dueDate.getTime() !== current.dueDate.getTime()) {
      await logAudit('packaging_request', id, 'due_date_changed', input.actor, {
        from: current.dueDate,
        to: input.dueDate
      });
    }

    return updated;
  },

  async listDesignRounds(requestId: string) {
    const request = await prisma.packagingRequest.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) throw new NotFoundError('Solicitud no encontrada.');
    return packagingRepository.listRounds(requestId);
  },

  async createDesignRound(requestId: string, input: CreateDesignRoundInput) {
    const request = await prisma.packagingRequest.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) throw new NotFoundError('Solicitud no encontrada.');

    const openRounds = await packagingRepository.countOpenRounds(requestId);
    if (openRounds > 0) {
      throw new ConflictError('No se puede crear una nueva ronda mientras exista una ronda abierta.');
    }

    const lastRound = await packagingRepository.getLastRound(requestId);
    const nextRoundNumber = (lastRound?.roundNumber ?? 0) + 1;

    const created = await prisma.$transaction(async (tx) => {
      const round = await tx.packagingDesignRound.create({
        data: {
          requestId,
          roundNumber: nextRoundNumber,
          proposalUrl: input.proposalUrl,
          designComment: input.designComment,
          createdBy: input.createdBy ?? input.actor ?? 'system',
          sentAt: new Date()
        }
      });

      await tx.packagingRequest.update({
        where: { id: requestId },
        data: {
          roundsCount: nextRoundNumber,
          status: 'en_observaciones_correcciones'
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: 'packaging_design_round',
          entityId: round.id,
          action: 'design_round_created',
          actor: input.actor ?? input.createdBy ?? 'system',
          diffJson: { requestId, roundNumber: nextRoundNumber }
        }
      });

      return round;
    });

    return created;
  },

  async updateDesignRound(requestId: string, roundId: string, input: UpdateDesignRoundInput) {
    const round = await packagingRepository.getRoundById(requestId, roundId);
    if (!round) throw new NotFoundError('Ronda no encontrada.');

    const shouldClose = input.status === 'cerrada';
    const nextProductDecision = input.productDecision ?? round.productDecision;
    const nextQualityDecision = input.qualityDecision ?? round.qualityDecision;

    if (shouldClose && !canCloseRound(nextProductDecision, nextQualityDecision)) {
      throw new ConflictError('No se puede cerrar la ronda sin decisión de Producto y Calidad.');
    }

    let roundResult = round.roundResult;
    if (nextProductDecision && nextQualityDecision) {
      roundResult = computeRoundResult(nextProductDecision, nextQualityDecision);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.packagingDesignRound.update({
        where: { id: roundId },
        data: {
          proposalUrl: input.proposalUrl,
          designComment: input.designComment,
          productComment: input.productComment,
          qualityComment: input.qualityComment,
          productDecision: input.productDecision,
          qualityDecision: input.qualityDecision,
          minorObservationsResolved: input.minorObservationsResolved,
          status: input.status,
          roundResult,
          closedAt: shouldClose ? new Date() : round.closedAt
        }
      });

      if (shouldClose && roundResult) {
        const requestStatus: PackagingRequestStatus = canMoveToFinalApprovals(roundResult, changed.minorObservationsResolved)
          ? 'lista_para_aprobaciones_finales'
          : 'en_observaciones_correcciones';

        await tx.packagingRequest.update({
          where: { id: requestId },
          data: {
            status: requestStatus
          }
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: 'packaging_design_round',
          entityId: roundId,
          action: 'design_round_updated',
          actor: input.actor ?? 'system',
          diffJson: {
            requestId,
            status: input.status,
            roundResult
          }
        }
      });

      return changed;
    });

    return updated;
  },

  async updateChecklistItem(requestId: string, checklistItemId: string, input: UpdateChecklistItemInput) {
    const item = await prisma.checklistItem.findUnique({ where: { id: checklistItemId } });
    if (!item || item.requestId !== requestId) {
      throw new NotFoundError('Checklist item no encontrado para la solicitud.');
    }

    const updated = await prisma.checklistItem.update({
      where: { id: checklistItemId },
      data: {
        status: input.status,
        responsibleName: input.responsibleName,
        comment: input.comment,
        relatedFileType: input.relatedFileType,
        completedAt: input.status === 'completado' ? new Date() : null
      }
    });

    await logAudit('packaging_request', requestId, 'checklist_item_updated', input.actor, {
      checklistItemId,
      status: input.status
    });

    return updated;
  },

  async updateApproval(requestId: string, stage: ApprovalStage, input: UpdateApprovalInput) {
    const request = await prisma.packagingRequest.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    const existingApproval = await prisma.requestApproval.findUnique({
      where: {
        requestId_approvalStage: {
          requestId,
          approvalStage: stage
        }
      },
      select: { id: true }
    });
    if (!existingApproval) {
      throw new NotFoundError('Aprobación no encontrada.');
    }

    const updated = await prisma.requestApproval.update({
      where: {
        requestId_approvalStage: {
          requestId,
          approvalStage: stage
        }
      },
      data: {
        status: input.status,
        comment: input.comment,
        decidedAt: input.status === 'pendiente' ? null : new Date()
      }
    });

    if (input.status === 'rechazado') {
      await prisma.packagingRequest.update({
        where: { id: requestId },
        data: {
          status: 'ajustes_correcciones'
        }
      });
      await logAudit('packaging_request', requestId, 'status_changed', input.actor, {
        reason: 'approval_rejected',
        to: 'ajustes_correcciones'
      });
    }

    await logAudit('packaging_request', requestId, 'approval_updated', input.actor, {
      stage,
      status: input.status
    });

    return updated;
  },

  async addFileLink(requestId: string, input: AddFileLinkInput) {
    const request = await prisma.packagingRequest.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    const created = await prisma.requestFileLink.create({
      data: {
        requestId,
        fileType: input.fileType,
        label: input.label,
        url: input.url,
        versionLabel: input.versionLabel,
        uploadedBy: input.uploadedBy
      }
    });

    await logAudit('packaging_request', requestId, 'file_link_added', input.actor, {
      fileType: input.fileType,
      label: input.label
    });

    return created;
  },

  async addAssignee(requestId: string, assigneeName: string, role?: string, actor?: string) {
    const request = await prisma.packagingRequest.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    const created = await prisma.packagingRequestAssignee.create({
      data: {
        requestId,
        assigneeName,
        role
      }
    });

    await logAudit('packaging_request', requestId, 'assignee_added', actor, { assigneeName, role });

    return created;
  }
};
