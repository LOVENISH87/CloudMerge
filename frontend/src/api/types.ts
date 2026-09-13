export interface ConnectedAccount {
  id: string;
  googleAccountEmail: string;
  quotaTotalBytes: string;
  quotaUsedBytes: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface StorageSummary {
  accountCount: number;
  totalBytes: string;
  usedBytes: string;
  freeBytes: string;
  accounts: {
    id: string;
    googleAccountEmail: string;
    totalBytes: string;
    usedBytes: string;
    lastSyncedAt: string | null;
  }[];
}

export interface FileItem {
  id: string;
  userId: string;
  folderId: string | null;
  connectedAccountId: string;
  name: string;
  mimeType: string;
  sizeBytes: string;
  googleFileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
}
