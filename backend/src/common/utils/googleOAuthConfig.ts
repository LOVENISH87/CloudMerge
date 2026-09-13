import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { decrypt } from "./crypto";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export async function loadGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  const dbConfig = await prisma.globalOAuthConfig.findFirst();
  if (dbConfig) {
    return {
      clientId: dbConfig.googleClientId,
      clientSecret: decrypt(dbConfig.googleClientSecretEnc),
      redirectUri: dbConfig.redirectUri,
    };
  }
  return { clientId: env.googleClientId, clientSecret: env.googleClientSecret, redirectUri: env.googleRedirectUri };
}
