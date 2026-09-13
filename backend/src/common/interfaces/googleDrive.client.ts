import { Readable } from "stream";
import { google, drive_v3, Auth } from "googleapis";
import { loadGoogleOAuthConfig } from "../utils/googleOAuthConfig";

export interface DriveQuota {
  totalBytes: number;
  usedBytes: number;
}

export interface DriveUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IGoogleDriveClient {
  getQuota(): Promise<DriveQuota>;
  uploadFile(name: string, mimeType: string, stream: Readable): Promise<DriveUploadResult>;
  downloadFile(fileId: string): Promise<Readable>;
  deleteFile(fileId: string): Promise<void>;
}

export class GoogleDriveClient implements IGoogleDriveClient {
  private drive: drive_v3.Drive;

  private constructor(oauth2: Auth.OAuth2Client) {
    this.drive = google.drive({ version: "v3", auth: oauth2 });
  }

  static async create(accessToken: string, refreshToken: string): Promise<GoogleDriveClient> {
    const { clientId, clientSecret, redirectUri } = await loadGoogleOAuthConfig();
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    return new GoogleDriveClient(oauth2);
  }

  async getQuota(): Promise<DriveQuota> {
    const res = await this.drive.about.get({ fields: "storageQuota" });
    const quota = res.data.storageQuota;
    return {
      totalBytes: Number(quota?.limit ?? 0),
      usedBytes: Number(quota?.usage ?? 0),
    };
  }

  async uploadFile(name: string, mimeType: string, stream: Readable): Promise<DriveUploadResult> {
    const res = await this.drive.files.create({
      requestBody: { name },
      media: { mimeType, body: stream },
      fields: "id,name,mimeType,size",
    });
    return {
      fileId: res.data.id!,
      name: res.data.name!,
      mimeType: res.data.mimeType ?? mimeType,
      sizeBytes: Number(res.data.size ?? 0),
    };
  }

  async downloadFile(fileId: string): Promise<Readable> {
    const res = await this.drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
    return res.data as unknown as Readable;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }
}
