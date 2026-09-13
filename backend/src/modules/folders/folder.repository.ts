import { Folder } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface IFolderRepository {
  list(userId: string, parentId: string | null): Promise<Folder[]>;
  recent(userId: string, limit: number): Promise<Folder[]>;
  create(userId: string, name: string, parentId: string | null): Promise<Folder>;
  findByIdForUser(id: string, userId: string): Promise<Folder | null>;
  delete(id: string): Promise<void>;
}

export class PrismaFolderRepository implements IFolderRepository {
  list(userId: string, parentId: string | null) {
    return prisma.folder.findMany({ where: { userId, parentId }, orderBy: { name: "asc" } });
  }

  recent(userId: string, limit: number) {
    return prisma.folder.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  }

  create(userId: string, name: string, parentId: string | null) {
    return prisma.folder.create({ data: { userId, name, parentId } });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.folder.findFirst({ where: { id, userId } });
  }

  async delete(id: string) {
    await prisma.folder.delete({ where: { id } });
  }
}
