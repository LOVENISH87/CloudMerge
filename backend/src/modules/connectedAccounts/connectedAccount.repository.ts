import { ConnectedGoogleAccount } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface CreateConnectedAccountInput {
  userId: string;
  googleAccountEmail: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: Date | null;
}

export interface IConnectedAccountRepository {
  findByUserAndEmail(userId: string, email: string): Promise<ConnectedGoogleAccount | null>;
  upsert(input: CreateConnectedAccountInput): Promise<ConnectedGoogleAccount>;
  listByUser(userId: string): Promise<ConnectedGoogleAccount[]>;
  findById(id: string): Promise<ConnectedGoogleAccount | null>;
  findByIdForUser(id: string, userId: string): Promise<ConnectedGoogleAccount | null>;
  delete(id: string): Promise<void>;
  updateQuota(id: string, totalBytes: bigint, usedBytes: bigint): Promise<void>;
}

export class PrismaConnectedAccountRepository implements IConnectedAccountRepository {
  findByUserAndEmail(userId: string, googleAccountEmail: string) {
    return prisma.connectedGoogleAccount.findUnique({
      where: { userId_googleAccountEmail: { userId, googleAccountEmail } },
    });
  }

  upsert(input: CreateConnectedAccountInput) {
    return prisma.connectedGoogleAccount.upsert({
      where: { userId_googleAccountEmail: { userId: input.userId, googleAccountEmail: input.googleAccountEmail } },
      create: input,
      update: {
        accessTokenEnc: input.accessTokenEnc,
        refreshTokenEnc: input.refreshTokenEnc,
        tokenExpiresAt: input.tokenExpiresAt,
      },
    });
  }

  listByUser(userId: string) {
    return prisma.connectedGoogleAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  }

  findById(id: string) {
    return prisma.connectedGoogleAccount.findUnique({ where: { id } });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.connectedGoogleAccount.findFirst({ where: { id, userId } });
  }

  async delete(id: string) {
    await prisma.connectedGoogleAccount.delete({ where: { id } });
  }

  async updateQuota(id: string, totalBytes: bigint, usedBytes: bigint) {
    await prisma.connectedGoogleAccount.update({
      where: { id },
      data: { quotaTotalBytes: totalBytes, quotaUsedBytes: usedBytes, lastSyncedAt: new Date() },
    });
  }
}
