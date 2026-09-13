import { Readable } from "stream";
import { IConnectedAccountRepository } from "../connectedAccounts/connectedAccount.repository";
import { IFileRepository } from "../files/file.repository";
import { AccountPickerStrategy } from "../../strategies/accountPicker.strategy";
import { GoogleDriveClient } from "../../common/interfaces/googleDrive.client";
import { decryptAccountTokens } from "../../common/utils/accountTokens";
import { Errors } from "../../common/errors/AppError";

interface GoogleApiError {
  code?: number;
  response?: { status?: number; data?: { error?: { errors?: { reason?: string }[] } } };
}

function isQuotaExceededError(err: unknown): boolean {
  const e = err as GoogleApiError;
  const status = e.response?.status ?? e.code;
  if (status !== 403 && status !== 507) return false;
  const reasons = e.response?.data?.error?.errors?.map((x) => x.reason) ?? [];
  return status === 507 || reasons.some((r) => r === "storageQuotaExceeded" || r === "quotaExceeded");
}

export class UploadService {
  constructor(
    private accounts: IConnectedAccountRepository,
    private files: IFileRepository,
    private pickStrategy: AccountPickerStrategy
  ) {}

  async upload(userId: string, folderId: string | null, name: string, mimeType: string, buffer: Buffer) {
    const allAccounts = await this.accounts.listByUser(userId);
    if (allAccounts.length === 0) throw Errors.badRequest("No connected Google accounts");

    const candidates = this.pickStrategy(allAccounts, buffer.length);

    let lastErr: unknown;
    for (const account of candidates) {
      try {
        const { accessToken, refreshToken } = decryptAccountTokens(account);
        const drive = await GoogleDriveClient.create(accessToken, refreshToken);
        const result = await drive.uploadFile(name, mimeType, Readable.from(buffer));

        return this.files.create({
          userId,
          folderId,
          connectedAccountId: account.id,
          name: result.name,
          mimeType: result.mimeType,
          sizeBytes: BigInt(result.sizeBytes || buffer.length),
          googleFileId: result.fileId,
        });
      } catch (err) {
        lastErr = err;
        if (!isQuotaExceededError(err)) throw err;
        // quota exceeded on this account — try the next candidate
      }
    }

    throw Errors.conflict(
      `Upload failed: all connected accounts are out of space (${(lastErr as Error)?.message ?? "unknown error"})`
    );
  }
}
