import { decrypt } from "./crypto";

interface EncryptedTokens {
  accessTokenEnc: string;
  refreshTokenEnc: string;
}

export function decryptAccountTokens(account: EncryptedTokens): { accessToken: string; refreshToken: string } {
  return {
    accessToken: decrypt(account.accessTokenEnc),
    refreshToken: decrypt(account.refreshTokenEnc),
  };
}
