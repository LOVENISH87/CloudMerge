import { useEffect, useRef, useState } from "react";
import { theme } from "../theme";
import { filesApi, connectedAccountsApi } from "../api/resources";
import type { FileItem } from "../api/types";
import { formatBytes, formatDate } from "../utils/format";
import { uploadFile } from "../api/upload";
import type { MenuState } from "./ContextMenu";
import type { UploadState } from "./UploadPanel";
import { Button } from "./Button";

export function FilesView({
  refreshKey,
  onContextMenu,
  onUploadStart,
  onUploadProgress,
  onUploadDone,
}: {
  refreshKey: number;
  onContextMenu: (m: MenuState) => void;
  onUploadStart: (u: UploadState) => void;
  onUploadProgress: (u: UploadState) => void;
  onUploadDone: () => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [accountEmails, setAccountEmails] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    filesApi.list().then(setFiles).catch(() => {});
    connectedAccountsApi
      .list()
      .then((accounts) => {
        const map: Record<string, string> = {};
        accounts.forEach((a) => (map[a.id] = a.googleAccountEmail.split("@")[0]));
        setAccountEmails(map);
      })
      .catch(() => {});
  }, [refreshKey]);

  const totalSize = files.reduce((s, f) => s + Number(f.sizeBytes), 0);

  const handleFilePicked = async (file: File) => {
    onUploadStart({ fileName: file.name, pct: 0 });
    try {
      await uploadFile(file, null, (pct) => onUploadProgress({ fileName: file.name, pct }));
      onUploadProgress({ fileName: file.name, pct: 100, done: true });
      onUploadDone();
    } catch (err) {
      onUploadProgress({ fileName: file.name, pct: 0, error: (err as Error).message });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
          <span>cloudmerge</span>
          <span style={{ color: theme.border }}>/</span>
          <span style={{ color: theme.text }}>all files</span>
        </div>
        <Button variant="primary" onClick={() => fileInput.current?.click()}>
          + upload
        </Button>
        <input
          ref={fileInput}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFilePicked(file);
            e.target.value = "";
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${theme.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            height: 32,
            alignItems: "center",
            background: theme.panel,
            borderBottom: `1px solid ${theme.border}`,
            fontFamily: theme.mono,
            fontSize: 11,
            color: theme.muted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          <div style={{ flex: 1, padding: "0 12px" }}>name</div>
          <div style={{ width: 140, padding: "0 12px" }}>account</div>
          <div style={{ width: 90, padding: "0 12px", textAlign: "right" }}>size</div>
          <div style={{ width: 120, padding: "0 12px" }}>modified</div>
        </div>

        {files.length === 0 && (
          <div style={{ padding: "24px 12px", fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>no files yet</div>
        )}

        {files.map((f) => {
          const sel = selected === f.id;
          const ext = f.name.slice(f.name.lastIndexOf(".") + 1);
          return (
            <div
              key={f.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(f.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(f.id);
                onContextMenu({ x: e.clientX, y: e.clientY, file: f });
              }}
              style={{
                display: "flex",
                height: 36,
                alignItems: "center",
                borderBottom: `1px solid ${theme.border}`,
                borderLeft: sel ? `2px solid ${theme.accent}` : "2px solid transparent",
                background: sel ? theme.panel : "transparent",
                cursor: "default",
              }}
            >
              <div style={{ flex: 1, padding: "0 12px", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: 10,
                    color: theme.muted,
                    background: theme.border,
                    borderRadius: 4,
                    padding: "2px 5px",
                    flexShrink: 0,
                  }}
                >
                  {ext}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              </div>
              <div style={{ width: 140, padding: "0 12px", fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
                {accountEmails[f.connectedAccountId] ?? "—"}
              </div>
              <div style={{ width: 90, padding: "0 12px", textAlign: "right", fontFamily: theme.mono, fontSize: 12 }}>
                {formatBytes(f.sizeBytes)}
              </div>
              <div style={{ width: 120, padding: "0 12px", fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
                {formatDate(f.createdAt)}
              </div>
            </div>
          );
        })}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            height: 28,
            alignItems: "center",
            padding: "0 12px",
            background: theme.panel,
            borderTop: `1px solid ${theme.border}`,
            fontFamily: theme.mono,
            fontSize: 11,
            color: theme.muted,
          }}
        >
          <span>{files.length} items</span>
          <span>{formatBytes(totalSize)} shown</span>
        </div>
      </div>
    </div>
  );
}
