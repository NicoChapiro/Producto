import { ApprovalStage, Prisma } from '@prisma/client';
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
        fileLinks: { orderBy: { createdAt: 'desc' } }
      }
    });
  },

  getRequestHistory(id: string) {
    return prisma.auditLog.findMany({
      where: {
        entityType: 'packaging_request',
        entityId: id
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
  }
};

export { prisma };
