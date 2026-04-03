import { ApprovalStage, DesignRoundStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const packagingRepository = {
  listRequests(filters?: {
    q?: string;
    status?: string;
    priority?: string;
    requestType?: string;
    owner?: string;
  }) {
    const where: Prisma.PackagingRequestWhereInput = {
      AND: [
        filters?.q
          ? {
              OR: [
                { code: { contains: filters.q, mode: 'insensitive' } },
                { title: { contains: filters.q, mode: 'insensitive' } },
                { productName: { contains: filters.q, mode: 'insensitive' } }
              ]
            }
          : {},
        filters?.status ? { status: filters.status as any } : {},
        filters?.priority ? { priority: filters.priority as any } : {},
        filters?.requestType ? { requestType: filters.requestType as any } : {},
        filters?.owner
          ? {
              OR: [
                { designOwnerName: { contains: filters.owner, mode: 'insensitive' } },
                { productOwnerName: { contains: filters.owner, mode: 'insensitive' } }
              ]
            }
          : {}
      ]
    };

    return prisma.packagingRequest.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }]
    });
  },

  getRequestById(id: string) {
    return prisma.packagingRequest.findUnique({
      where: { id },
      include: {
        assignees: true,
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        fileLinks: { orderBy: { createdAt: 'desc' } },
        designRounds: { orderBy: { roundNumber: 'asc' } }
      }
    });
  },

  async getRequestHistory(id: string) {
    const roundIds = await prisma.packagingDesignRound.findMany({
      where: { requestId: id },
      select: { id: true }
    });

    return prisma.auditLog.findMany({
      where: {
        OR: [
          {
            entityType: 'packaging_request',
            entityId: id
          },
          {
            entityType: 'packaging_design_round',
            entityId: { in: roundIds.map((row) => row.id) }
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  getLatestCode() {
    return prisma.packagingRequest.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });
  },

  getChecklistTemplates(requestType: Prisma.PackagingRequestUncheckedCreateInput['requestType']) {
    return prisma.checklistTemplate.findMany({
      where: { requestType: requestType as any },
      orderBy: { itemOrder: 'asc' }
    });
  },

  getApproval(requestId: string, stage: ApprovalStage) {
    return prisma.requestApproval.findUnique({
      where: {
        requestId_approvalStage: {
          requestId,
          approvalStage: stage
        }
      }
    });
  },

  getInputReadinessSignals(requestId: string) {
    return prisma.packagingRequest.findUnique({
      where: { id: requestId },
      select: {
        productName: true,
        checklistItems: {
          where: {
            status: 'completado',
            OR: [
              { templateItemName: { equals: 'Brief recibido', mode: 'insensitive' } },
              { templateItemName: { equals: 'Brief completo', mode: 'insensitive' } },
              { templateItemName: { equals: 'Referencias visuales recibidas', mode: 'insensitive' } }
            ]
          },
          select: { templateItemName: true }
        },
        fileLinks: {
          where: {
            fileType: {
              in: ['brief', 'originales', 'propuesta']
            }
          },
          select: { fileType: true }
        }
      }
    });
  },

  listRounds(requestId: string) {
    return prisma.packagingDesignRound.findMany({
      where: { requestId },
      orderBy: { roundNumber: 'asc' }
    });
  },

  getRoundById(requestId: string, roundId: string) {
    return prisma.packagingDesignRound.findFirst({
      where: { id: roundId, requestId }
    });
  },

  getLastRound(requestId: string) {
    return prisma.packagingDesignRound.findFirst({
      where: { requestId },
      orderBy: { roundNumber: 'desc' }
    });
  },

  getLatestClosedRound(requestId: string) {
    return prisma.packagingDesignRound.findFirst({
      where: {
        requestId,
        status: 'cerrada'
      },
      orderBy: { roundNumber: 'desc' }
    });
  },

  countOpenRounds(requestId: string) {
    return prisma.packagingDesignRound.count({
      where: { requestId, status: DesignRoundStatus.abierta }
    });
  }
};

export { prisma };
