import { Response } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema";
import { AuthedRequest } from "../../common/middleware/requireAuth";
import { Errors } from "../../common/errors/AppError";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: AuthedRequest, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);
    const result = await this.authService.register(email, password);
    res.status(201).json(result);
  };

  login = async (req: AuthedRequest, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await this.authService.login(email, password);
    res.json(result);
  };

  refresh = async (req: AuthedRequest, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await this.authService.refresh(refreshToken);
    res.json(result);
  };

  logout = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    await this.authService.logout(req.user.id);
    res.status(204).send();
  };

  me = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const user = await this.authService.me(req.user.id);
    res.json(user);
  };
}
