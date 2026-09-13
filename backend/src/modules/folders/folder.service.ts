import { IFolderRepository } from "./folder.repository";
import { Errors } from "../../common/errors/AppError";

export class FolderService {
  constructor(private repo: IFolderRepository) {}

  list(userId: string, parentId: string | null) {
    return this.repo.list(userId, parentId);
  }

  recent(userId: string, limit: number) {
    return this.repo.recent(userId, limit);
  }

  async create(userId: string, name: string, parentId: string | null) {
    if (parentId) {
      const parent = await this.repo.findByIdForUser(parentId, userId);
      if (!parent) throw Errors.notFound("Parent folder not found");
    }
    return this.repo.create(userId, name, parentId);
  }

  async delete(userId: string, folderId: string) {
    const folder = await this.repo.findByIdForUser(folderId, userId);
    if (!folder) throw Errors.notFound("Folder not found");
    await this.repo.delete(folderId);
  }
}
