import { useEffect, useRef, useState } from "react";
import { theme } from "../theme";
import { filesApi, connectedAccountsApi } from "../api/resources";
import type { FileItem } from "../api/types";
import { formatBytes, formatDate } from "../utils/format";
import { uploadFile } from "../api/upload";
import type { MenuState } from "./ContextMenu";
import type { UploadState } from "./UploadPanel";
import { Button } from "./Button";
import { File, Image as ImageIcon, FileText, Video, FileArchive, Folder, Search, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);

  const ITEMS_PER_PAGE = 30;

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

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE) || 1;
  const paginatedFiles = filteredFiles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalSize = filteredFiles.reduce((s, f) => s + Number(f.sizeBytes), 0);

  // Reset page when searching
  useEffect(() => setPage(1), [search]);

  const handleFilePicked = async (file: globalThis.File) => {
    onUploadStart({ fileName: file.name, pct: 0 });
    try {
      await uploadFile(file, null, (pct) => onUploadProgress({ fileName: file.name, pct }));
      onUploadProgress({ fileName: file.name, pct: 100, done: true });
      onUploadDone();
    } catch (err) {
      onUploadProgress({ fileName: file.name, pct: 0, error: (err as Error).message });
    }
  };

  const getFileIcon = (mimeType: string, size: number) => {
    if (mimeType.includes("image/")) return <ImageIcon size={size} color={theme.accent} />;
    if (mimeType.includes("video/")) return <Video size={size} color="#E53935" />;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText size={size} color="#1E88E5" />;
    if (mimeType.includes("zip") || mimeType.includes("tar")) return <FileArchive size={size} color="#FDD835" />;
    if (mimeType === "application/vnd.google-apps.folder") return <Folder size={size} color={theme.accent} fill={theme.accent} />;
    return <File size={size} color={theme.muted} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: theme.mono, fontSize: 13, color: theme.muted }}>
          <span style={{ fontWeight: 600 }}>CloudMerge</span>
          <span style={{ color: theme.border }}>/</span>
          <span style={{ color: theme.text }}>All Files</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search Bar */}
          <div style={{ position: "relative" }}>
            <Search size={14} color={theme.muted} style={{ position: "absolute", left: 10, top: 9 }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: theme.panel, border: `1px solid ${theme.border}`, color: theme.text,
                padding: "6px 12px 6px 30px", borderRadius: 20, outline: "none", fontSize: 13, width: 220
              }}
            />
          </div>

          {/* View Toggles */}
          <div style={{ display: "flex", background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 6, overflow: "hidden" }}>
            <button 
              onClick={() => setViewMode("list")} 
              style={{ background: viewMode === "list" ? theme.border : "transparent", border: "none", padding: "6px 10px", cursor: "pointer", display: "flex" }}
            >
              <List size={16} color={viewMode === "list" ? theme.text : theme.muted} />
            </button>
            <button 
              onClick={() => setViewMode("grid")} 
              style={{ background: viewMode === "grid" ? theme.border : "transparent", border: "none", padding: "6px 10px", cursor: "pointer", display: "flex" }}
            >
              <Grid size={16} color={viewMode === "grid" ? theme.text : theme.muted} />
            </button>
          </div>

          <Button variant="primary" onClick={() => fileInput.current?.click()}>+ Upload</Button>
          <input ref={fileInput} type="file" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFilePicked(file); e.target.value = ""; }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: 8 }}>
        {paginatedFiles.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: theme.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Folder size={48} opacity={0.5} />
            <span>No files found</span>
          </div>
        ) : viewMode === "grid" ? (
          // GRID VIEW
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 16, paddingBottom: 20 }}>
            {paginatedFiles.map(f => {
              const sel = selected === f.id;
              return (
                <div
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); setSelected(f.id); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(f.id); onContextMenu({ x: e.clientX, y: e.clientY, file: f }); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", padding: 12,
                    background: sel ? theme.panel : "transparent", border: `1px solid ${sel ? theme.accent : "transparent"}`,
                    borderRadius: 8, cursor: "default", transition: "all 0.1s"
                  }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget.style.background = theme.panel) }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget.style.background = "transparent") }}
                >
                  <div style={{ marginBottom: 12 }}>{getFileIcon(f.mimeType, 48)}</div>
                  <div style={{ fontSize: 12, color: theme.text, textAlign: "center", wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 4 }}>{formatBytes(f.sizeBytes)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          // LIST VIEW
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, overflow: "hidden" }}>
             <div style={{ display: "flex", height: 36, alignItems: "center", background: theme.panel, borderBottom: `1px solid ${theme.border}`, fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              <div style={{ flex: 1, padding: "0 16px" }}>Name</div>
              <div style={{ width: 140, padding: "0 12px" }}>Account</div>
              <div style={{ width: 100, padding: "0 12px", textAlign: "right" }}>Size</div>
              <div style={{ width: 140, padding: "0 16px" }}>Modified</div>
            </div>
            {paginatedFiles.map(f => {
              const sel = selected === f.id;
              return (
                <div
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); setSelected(f.id); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(f.id); onContextMenu({ x: e.clientX, y: e.clientY, file: f }); }}
                  style={{
                    display: "flex", height: 44, alignItems: "center", borderBottom: `1px solid ${theme.border}`,
                    background: sel ? theme.panel : "transparent", cursor: "default"
                  }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget.style.background = "rgba(255,255,255,0.02)") }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget.style.background = "transparent") }}
                >
                  <div style={{ flex: 1, padding: "0 16px", display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                    {getFileIcon(f.mimeType, 18)}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{f.name}</span>
                  </div>
                  <div style={{ width: 140, padding: "0 12px", fontSize: 12, color: theme.muted }}>{accountEmails[f.connectedAccountId] ?? "—"}</div>
                  <div style={{ width: 100, padding: "0 12px", textAlign: "right", fontFamily: theme.mono, fontSize: 12 }}>{formatBytes(f.sizeBytes)}</div>
                  <div style={{ width: 140, padding: "0 16px", fontSize: 12, color: theme.muted }}>{formatDate(f.createdAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 44, borderTop: `1px solid ${theme.border}`, marginTop: "auto", fontSize: 12, color: theme.muted, paddingTop: 16 }}>
        <span>Showing {filteredFiles.length} files ({formatBytes(totalSize)})</span>
        
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ display: "flex", alignItems: "center", background: "none", border: "none", color: page === 1 ? theme.border : theme.text, cursor: page === 1 ? "default" : "pointer" }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontFamily: theme.mono }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ display: "flex", alignItems: "center", background: "none", border: "none", color: page === totalPages ? theme.border : theme.text, cursor: page === totalPages ? "default" : "pointer" }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
