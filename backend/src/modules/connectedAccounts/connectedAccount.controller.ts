import { Response } from "express";
import jwt from "jsonwebtoken";
import { ConnectedAccountService } from "./connectedAccount.service";
import { AuthedRequest, paramId } from "../../common/middleware/requireAuth";
import { Errors } from "../../common/errors/AppError";
import { env } from "../../config/env";

function serialize(account: {
  id: string;
  googleAccountEmail: string;
  quotaTotalBytes: bigint;
  quotaUsedBytes: bigint;
  lastSyncedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: account.id,
    googleAccountEmail: account.googleAccountEmail,
    quotaTotalBytes: account.quotaTotalBytes.toString(),
    quotaUsedBytes: account.quotaUsedBytes.toString(),
    lastSyncedAt: account.lastSyncedAt,
    createdAt: account.createdAt,
  };
}

export class ConnectedAccountController {
  constructor(private service: ConnectedAccountService) {}

  getConnectUrl = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const url = await this.service.getConnectUrl(req.user.id);
    res.json({ url });
  };

  getLoginUrl = async (_req: AuthedRequest, res: Response) => {
    const url = await this.service.getLoginUrl();
    res.json({ url });
  };

  callback = async (req: AuthedRequest, res: Response) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    try {
      if (!code || !state) throw Errors.badRequest("Missing code or state");
      const result = await this.service.handleCallback(code, state);
      if (result.mode === "login") {
        res.redirect(
          `${env.frontendUrl}/?loginAccessToken=${encodeURIComponent(result.accessToken)}&loginRefreshToken=${encodeURIComponent(result.refreshToken)}`
        );
      } else {
        res.redirect(`${env.frontendUrl}/?connected=1`);
      }
    } catch (err) {
      // best-effort: was this a login attempt or a connect-account attempt? decode without verifying so the error lands on the right screen
      const decoded = state ? (jwt.decode(state) as { purpose?: string } | null) : null;
      const isLogin = decoded?.purpose === "google_login_state";
      const param = isLogin ? "loginError" : "error";
      const flag = isLogin ? "" : "connected=0&";
      res.redirect(`${env.frontendUrl}/?${flag}${param}=${encodeURIComponent((err as Error).message)}`);
    }
  };

  list = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const accounts = await this.service.list(req.user.id);
    res.json(accounts.map(serialize));
  };

  delete = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    await this.service.delete(req.user.id, paramId(req));
    res.status(204).send();
  };

  syncQuota = async (req: AuthedRequest, res: Response) => {
    if (!req.user) throw Errors.unauthorized();
    const quota = await this.service.syncQuota(req.user.id, paramId(req));
    res.json(quota);
  };
}
