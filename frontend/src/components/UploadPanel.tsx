import { theme } from "../theme";

export interface UploadState {
  fileName: string;
  pct: number;
  done?: boolean;
  error?: string;
}

export function UploadPanel({ upload }: { upload: UploadState }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 280,
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.mono, fontSize: 11, color: theme.muted, marginBottom: 8 }}>
        <span>{upload.error ? "upload failed" : upload.done ? "uploaded" : "uploading"}</span>
        <span style={{ color: upload.error ? theme.danger : theme.accent }}>{upload.error ? "" : `${upload.pct}%`}</span>
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 12, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {upload.fileName}
      </div>
      {upload.error ? (
        <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.danger }}>{upload.error}</div>
      ) : (
        <div style={{ height: 8, background: theme.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: theme.accent, width: `${upload.pct}%`, transition: "width 200ms ease" }} />
        </div>
      )}
    </div>
  );
}
