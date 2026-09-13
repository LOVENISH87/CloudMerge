import { ConnectedGoogleAccount } from "@prisma/client";

/**
 * Returns candidate accounts ranked best-first for a given upload.
 * Swappable: pass a different function into UploadService to change routing behavior.
 */
export type AccountPickerStrategy = (
  accounts: ConnectedGoogleAccount[],
  fileSizeBytes: number
) => ConnectedGoogleAccount[];

function freeBytes(a: ConnectedGoogleAccount): bigint {
  return a.quotaTotalBytes - a.quotaUsedBytes;
}

// ponytail: quota is a DB cache refreshed via sync-quota, so this can be stale;
// upload.service falls back to the next candidate on a live quota-exceeded error anyway.
export const mostFreeSpaceStrategy: AccountPickerStrategy = (accounts, fileSizeBytes) => {
  const sorted = [...accounts].sort((a, b) => (freeBytes(b) > freeBytes(a) ? 1 : -1));
  const fitting = sorted.filter((a) => freeBytes(a) >= BigInt(fileSizeBytes));
  return fitting.length > 0 ? fitting : sorted;
};
