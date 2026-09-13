import { User } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string }): Promise<User>;
  setRefreshTokenHash(id: string, hash: string | null): Promise<void>;
}

export class PrismaUserRepository implements IUserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  }

  async setRefreshTokenHash(id: string, hash: string | null) {
    await prisma.user.update({ where: { id }, data: { refreshTokenHash: hash } });
  }
}
