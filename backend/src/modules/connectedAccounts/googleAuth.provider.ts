import { OAuth2Client } from "google-auth-library";
import { loadGoogleOAuthConfig } from "../../common/utils/googleOAuthConfig";

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number | null;
}

export interface IGoogleAuthProvider {
  getAuthUrl(state: string): Promise<string>;
  exchangeCode(code: string): Promise<GoogleTokens>;
  getAccountEmail(accessToken: string): Promise<string>;
}

export class GoogleAuthProvider implements IGoogleAuthProvider {
  private async client(): Promise<OAuth2Client> {
    const { clientId, clientSecret, redirectUri } = await loadGoogleOAuthConfig();
    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  async getAuthUrl(state: string): Promise<string> {
    const client = await this.client();
    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"],
      state,
    });
  }

  async exchangeCode(code: string): Promise<GoogleTokens> {
    const client = await this.client();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Google did not return offline tokens (missing refresh_token)");
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ?? null,
    };
  }

  async getAccountEmail(accessToken: string): Promise<string> {
    const client = await this.client();
    client.setCredentials({ access_token: accessToken });
    const info = await client.request<{ email: string }>({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });
    return info.data.email;
  }
}
