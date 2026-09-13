import { File } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface CreateFileInput {
  userId: string;
  folderId: string | null;
  connectedAccountId: string;
  name: string;
  mimeType: string;
  sizeBytes: bigint;
  googleFileId: string;
}

export interface IFileRepository {
  create(input: CreateFileInput): Promise<File>;
  listByUser(userId: string, folderId?: string | null): Promise<File[]>;
  findByIdForUser(id: string, userId: string): Promise<File | null>;
  findByIdForUserWithAccount(id: string, userId: string): Promise<(File & { connectedAccount: { accessTokenEnc: string; refreshTokenEnc: string } }) | null>;
  rename(id: string, name: string): Promise<File>;
  delete(id: string): Promise<void>;
}

export class PrismaFileRepository implements IFileRepository {
  create(input: CreateFileInput) {
    return prisma.file.create({ data: input });
  }

  listByUser(userId: string, folderId?: string | null) {
    return prisma.file.findMany({
      where: { userId, ...(folderId !== undefined ? { folderId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.file.findFirst({ where: { id, userId } });
  }

  findByIdForUserWithAccount(id: string, userId: string) {
    return prisma.file.findFirst({
      where: { id, userId },
      include: { connectedAccount: { select: { accessTokenEnc: true, refreshTokenEnc: true } } },
    }) as ReturnType<IFileRepository["findByIdForUserWithAccount"]>;
  }

  rename(id: string, name: string) {
    return prisma.file.update({ where: { id }, data: { name } });
  }

  async delete(id: string) {
    await prisma.file.delete({ where: { id } });
  }
}
