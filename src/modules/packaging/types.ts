import {
  ApprovalStage,
  ApprovalStatus,
  ChecklistItemStatus,
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

export const DEFAULT_APPROVERS: Record<ApprovalStage, string> = {
  diseno: 'Herman',
  calidad: 'Anita',
  producto: 'Nicole'
};
