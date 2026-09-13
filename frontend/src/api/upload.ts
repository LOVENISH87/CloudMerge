import { API_URL, getAccessToken } from "./client";

export function uploadFile(
  file: File,
  folderId: string | null,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/uploads`);
    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(JSON.parse(xhr.responseText || "{}").error ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));

    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("folderId", folderId);
    xhr.send(form);
  });
}
