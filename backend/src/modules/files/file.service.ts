import { Readable } from "stream";
import { IFileRepository } from "./file.repository";
import { IConnectedAccountRepository } from "../connectedAccounts/connectedAccount.repository";
import { GoogleDriveClient } from "../../common/interfaces/googleDrive.client";
import { decryptAccountTokens } from "../../common/utils/accountTokens";
import { Errors } from "../../common/errors/AppError";
import { prisma } from "../../config/prisma";

export class FileService {
  constructor(private files: IFileRepository, private accounts: IConnectedAccountRepository) {}

  list(userId: string, folderId?: string | null) {
    return this.files.listByUser(userId, folderId);
  }

  async get(userId: string, fileId: string) {
    const file = await this.files.findByIdForUser(fileId, userId);
    if (!file) throw Errors.notFound("File not found");
    return file;
  }

  async rename(userId: string, fileId: string, name: string) {
    await this.get(userId, fileId);
    return this.files.rename(fileId, name);
  }

  async move(userId: string, fileId: string, folderId: string | null) {
    await this.get(userId, fileId);
    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
      if (!folder) throw Errors.notFound("Folder not found");
    }
    return prisma.file.update({ where: { id: fileId }, data: { folderId } });
  }

  async viewUrl(userId: string, fileId: string): Promise<string> {
    const file = await this.get(userId, fileId);
    return `https://drive.google.com/file/d/${file.googleFileId}/view`;
  }

  async downloadStream(userId: string, fileId: string): Promise<{ stream: Readable; file: Awaited<ReturnType<IFileRepository["findByIdForUser"]>> }> {
    const withAccount = await this.files.findByIdForUserWithAccount(fileId, userId);
    if (!withAccount) throw Errors.notFound("File not found");

    const { accessToken, refreshToken } = decryptAccountTokens(withAccount.connectedAccount);
    const drive = await GoogleDriveClient.create(accessToken, refreshToken);
    const stream = await drive.downloadFile(withAccount.googleFileId);
    return { stream, file: withAccount };
  }

  async delete(userId: string, fileId: string): Promise<void> {
    const withAccount = await this.files.findByIdForUserWithAccount(fileId, userId);
    if (!withAccount) throw Errors.notFound("File not found");

    const { accessToken, refreshToken } = decryptAccountTokens(withAccount.connectedAccount);
    const drive = await GoogleDriveClient.create(accessToken, refreshToken);
    await drive.deleteFile(withAccount.googleFileId);
    await this.files.delete(fileId);
  }
}
