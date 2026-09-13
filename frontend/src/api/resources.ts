import { api } from "./client";
import type { ConnectedAccount, StorageSummary, FileItem, Folder } from "./types";

export const connectedAccountsApi = {
  list: () => api<ConnectedAccount[]>("/connected-accounts"),
  getConnectUrl: () => api<{ url: string }>("/connected-accounts/google/connect-url"),
  getLoginUrl: () => api<{ url: string }>("/connected-accounts/google/login-url"),
  delete: (id: string) => api<void>(`/connected-accounts/${id}`, { method: "DELETE" }),
  syncQuota: (id: string) => api<{ totalBytes: number; usedBytes: number }>(`/connected-accounts/${id}/sync-quota`, { method: "POST" }),
};

export const storageApi = {
  summary: () => api<StorageSummary>("/storage/summary"),
};

export const filesApi = {
  list: (folderId?: string | null) =>
    api<FileItem[]>(`/files${folderId !== undefined ? `?folderId=${folderId ?? ""}` : ""}`),
  get: (id: string) => api<FileItem>(`/files/${id}`),
  rename: (id: string, name: string) => api<FileItem>(`/files/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  move: (id: string, folderId: string | null) =>
    api<FileItem>(`/files/${id}`, { method: "PATCH", body: JSON.stringify({ folderId }) }),
  viewUrl: (id: string) => api<{ url: string }>(`/files/${id}/view-url`),
  delete: (id: string) => api<void>(`/files/${id}`, { method: "DELETE" }),
};

export const foldersApi = {
  list: (parentId?: string | null) => api<Folder[]>(`/folders${parentId ? `?parentId=${parentId}` : ""}`),
  recent: (limit = 10) => api<Folder[]>(`/folders/recent?limit=${limit}`),
  create: (name: string, parentId?: string | null) =>
    api<Folder>("/folders", { method: "POST", body: JSON.stringify({ name, parentId }) }),
  delete: (id: string) => api<void>(`/folders/${id}`, { method: "DELETE" }),
};
