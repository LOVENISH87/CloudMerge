import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { IUserRepository } from "./user.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt";
import { Errors } from "../../common/errors/AppError";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private users: IUserRepository) {}

  async register(email: string, password: string): Promise<Tokens & { userId: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw Errors.conflict("Email already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ email, passwordHash });
    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, userId: user.id };
  }

  async login(email: string, password: string): Promise<Tokens & { userId: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) throw Errors.unauthorized("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Errors.unauthorized("Invalid credentials");

    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, userId: user.id };
  }

  // find-or-create by email, no password: identity is established by Google OAuth, not a local password
  async loginAsGoogleUser(email: string): Promise<Tokens & { userId: string }> {
    let user = await this.users.findByEmail(email);
    if (!user) {
      const passwordHash = await bcrypt.hash(randomUUID(), 10);
      user = await this.users.create({ email, passwordHash });
    }
    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, userId: user.id };
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    let sub: string;
    try {
      ({ sub } = verifyRefreshToken(refreshToken));
    } catch {
      throw Errors.unauthorized("Invalid refresh token");
    }

    const user = await this.users.findById(sub);
    if (!user?.refreshTokenHash) throw Errors.unauthorized("Invalid refresh token");

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw Errors.unauthorized("Invalid refresh token");

    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw Errors.notFound("User not found");
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  private async issueTokens(userId: string, email: string): Promise<Tokens> {
    const accessToken = signAccessToken({ sub: userId, email });
    const refreshToken = signRefreshToken({ sub: userId });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshTokenHash(userId, refreshTokenHash);
    return { accessToken, refreshToken };
  }
}
