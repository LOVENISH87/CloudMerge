import { Response } from "express";
import { FolderService } from "./folder.service";
import { createFolderSchema } from "./folder.schema";
import { AuthedRequest, paramId } from "../../common/middleware/requireAuth";
import { Errors } from "../../common/errors/AppError";

export class FolderController {
  constructor(private service: FolderService) {}

  list = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const parentId = (req.query.parentId as string | undefined) ?? null;
    const folders = await this.service.list(req.user.id, parentId);
    res.json(folders);
  };

  recent = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const folders = await this.service.recent(req.user.id, limit);
    res.json(folders);
  };

  create = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const { name, parentId } = createFolderSchema.parse(req.body);
    const folder = await this.service.create(req.user.id, name, parentId ?? null);
    res.status(201).json(folder);
  };

  delete = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    await this.service.delete(req.user.id, paramId(req));
    res.status(204).send();
  };
}
