import {
  ApprovalStage,
  ApprovalStatus,
  ChecklistItemStatus,
  DesignRoundDecision,
  DesignRoundStatus,
  PackagingRequestPriority,
  PackagingRequestStatus,
  PackagingRequestType,
  RequestFileType
} from '@prisma/client';

export type CreatePackagingRequestInput = {
  title: string;
  requestType: PackagingRequestType;
  brand: string;
  category: string;
  productName: string;
  projectName?: string;
  internalCode?: string;
  sku?: string;
  ean?: string;
  dun?: string;
  requesterName: string;
  designOwnerName: string;
  productOwnerName: string;
  requestDate: Date;
  dueDate: Date;
  priority: PackagingRequestPriority;
  generalComments?: string;
  sharepointFolderUrl?: string;
  assignees?: { assigneeName: string; role?: string }[];
  actor?: string;
};

export type UpdatePackagingRequestInput = Partial<
  Pick<
    CreatePackagingRequestInput,
    | 'title'
    | 'brand'
    | 'category'
    | 'productName'
    | 'projectName'
    | 'internalCode'
    | 'sku'
    | 'ean'
    | 'dun'
    | 'requesterName'
    | 'designOwnerName'
    | 'productOwnerName'
    | 'dueDate'
    | 'generalComments'
    | 'sharepointFolderUrl'
  >
> & {
  status?: PackagingRequestStatus;
  deliveredAt?: Date | null;
  receivedByProductAt?: Date | null;
  receivedByProductName?: string;
  sentToSupplierAt?: Date | null;
  sentToSupplierBy?: string;
  sentToSupplierComment?: string;
  completedAt?: Date | null;
  roundsCount?: number;
  requiresSupplierFlow?: boolean;
  actor?: string;
};

export type UpdateChecklistItemInput = {
  status: ChecklistItemStatus;
  responsibleName?: string;
  comment?: string;
  relatedFileType?: RequestFileType;
  actor?: string;
};

export type UpdateApprovalInput = {
  status: ApprovalStatus;
  comment?: string;
  actor?: string;
};

export type AddFileLinkInput = {
  fileType: RequestFileType;
  label: string;
  url: string;
  versionLabel?: string;
  uploadedBy?: string;
  actor?: string;
};

export type CreateDesignRoundInput = {
  proposalUrl?: string;
  designComment?: string;
  createdBy?: string;
  actor?: string;
};

export type UpdateDesignRoundInput = {
  proposalUrl?: string;
  designComment?: string;
  productComment?: string;
  qualityComment?: string;
  productDecision?: DesignRoundDecision;
  qualityDecision?: DesignRoundDecision;
  minorObservationsResolved?: boolean;
  status?: DesignRoundStatus;
  actor?: string;
};

export const DEFAULT_APPROVERS: Record<ApprovalStage, string> = {
  diseno: 'Herman',
  calidad: 'Anita',
  producto: 'Nicole'
};
