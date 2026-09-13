import jwt from "jsonwebtoken";
import { IGoogleAuthProvider } from "./googleAuth.provider";
import { IConnectedAccountRepository } from "./connectedAccount.repository";
import { GoogleDriveClient } from "../../common/interfaces/googleDrive.client";
import { decryptAccountTokens } from "../../common/utils/accountTokens";
import { encrypt } from "../../common/utils/crypto";
import { env } from "../../config/env";
import { Errors } from "../../common/errors/AppError";
import { AuthService } from "../auth/auth.service";

const CONNECT_PURPOSE = "google_oauth_state";
const LOGIN_PURPOSE = "google_login_state";

export type CallbackResult =
  | { mode: "connect" }
  | { mode: "login"; accessToken: string; refreshToken: string };

export class ConnectedAccountService {
  constructor(
    private googleAuth: IGoogleAuthProvider,
    private repo: IConnectedAccountRepository,
    private authService: AuthService
  ) {}

  async getConnectUrl(userId: string): Promise<string> {
    const state = jwt.sign({ sub: userId, purpose: CONNECT_PURPOSE }, env.jwtAccessSecret, { expiresIn: "10m" });
    return this.googleAuth.getAuthUrl(state);
  }

  // no userId yet — this is the "sign in with Google" entry point, not an already-authed user connecting another account
  async getLoginUrl(): Promise<string> {
    const state = jwt.sign({ purpose: LOGIN_PURPOSE }, env.jwtAccessSecret, { expiresIn: "10m" });
    return this.googleAuth.getAuthUrl(state);
  }

  async handleCallback(code: string, state: string): Promise<CallbackResult> {
    let payload: { sub?: string; purpose: string };
    try {
      payload = jwt.verify(state, env.jwtAccessSecret) as { sub?: string; purpose: string };
    } catch {
      throw Errors.badRequest("Invalid or expired OAuth state");
    }

    const tokens = await this.googleAuth.exchangeCode(code);
    const googleAccountEmail = await this.googleAuth.getAccountEmail(tokens.accessToken);

    if (payload.purpose === LOGIN_PURPOSE) {
      const session = await this.authService.loginAsGoogleUser(googleAccountEmail);
      // first sign-in also registers this same Google account as the user's first connected storage account
      const account = await this.repo.upsert({
        userId: session.userId,
        googleAccountEmail,
        accessTokenEnc: encrypt(tokens.accessToken),
        refreshTokenEnc: encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiryDate ? new Date(tokens.expiryDate) : null,
      });
      // don't let a Drive API hiccup block sign-in — quota can be synced later
      await this.fetchAndStoreQuota(account.id, tokens.accessToken, tokens.refreshToken).catch(() => {});
      return { mode: "login", accessToken: session.accessToken, refreshToken: session.refreshToken };
    }

    if (payload.purpose === CONNECT_PURPOSE && payload.sub) {
      const account = await this.repo.upsert({
        userId: payload.sub,
        googleAccountEmail,
        accessTokenEnc: encrypt(tokens.accessToken),
        refreshTokenEnc: encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiryDate ? new Date(tokens.expiryDate) : null,
      });
      await this.fetchAndStoreQuota(account.id, tokens.accessToken, tokens.refreshToken).catch(() => {});
      return { mode: "connect" };
    }

    throw Errors.badRequest("Invalid OAuth state purpose");
  }

  list(userId: string) {
    return this.repo.listByUser(userId);
  }

  async delete(userId: string, accountId: string): Promise<void> {
    const account = await this.repo.findByIdForUser(accountId, userId);
    if (!account) throw Errors.notFound("Connected account not found");
    await this.repo.delete(accountId);
  }

  async syncQuota(userId: string, accountId: string) {
    const account = await this.repo.findByIdForUser(accountId, userId);
    if (!account) throw Errors.notFound("Connected account not found");

    const { accessToken, refreshToken } = decryptAccountTokens(account);
    return this.fetchAndStoreQuota(accountId, accessToken, refreshToken);
  }

  private async fetchAndStoreQuota(accountId: string, accessToken: string, refreshToken: string) {
    const drive = await GoogleDriveClient.create(accessToken, refreshToken);
    const quota = await drive.getQuota();
    await this.repo.updateQuota(accountId, BigInt(quota.totalBytes), BigInt(quota.usedBytes));
    return { totalBytes: quota.totalBytes, usedBytes: quota.usedBytes };
  }
}
