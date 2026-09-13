import { Response } from "express";
import { FileService } from "./file.service";
import { patchFileSchema } from "./file.schema";
import { AuthedRequest, paramId } from "../../common/middleware/requireAuth";
import { Errors } from "../../common/errors/AppError";

function serialize(file: { sizeBytes: bigint }) {
  return { ...file, sizeBytes: file.sizeBytes.toString() };
}

export class FileController {
  constructor(private service: FileService) {}

  list = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const folderId = req.query.folderId !== undefined ? (req.query.folderId as string) || null : undefined;
    const files = await this.service.list(req.user.id, folderId);
    res.json(files.map(serialize));
  };

  get = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const file = await this.service.get(req.user.id, paramId(req));
    res.json(serialize(file));
  };

  patch = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const { name, folderId } = patchFileSchema.parse(req.body);
    let file = await this.service.get(req.user.id, paramId(req));
    if (name !== undefined) file = await this.service.rename(req.user.id, paramId(req), name);
    if (folderId !== undefined) file = await this.service.move(req.user.id, paramId(req), folderId);
    res.json(serialize(file));
  };

  viewUrl = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const url = await this.service.viewUrl(req.user.id, paramId(req));
    res.json({ url });
  };

  download = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const { stream, file } = await this.service.downloadStream(req.user.id, paramId(req));
    res.setHeader("Content-Type", file!.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${file!.name}"`);
    stream.pipe(res);
  };

  delete = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    await this.service.delete(req.user.id, paramId(req));
    res.status(204).send();
  };
}
