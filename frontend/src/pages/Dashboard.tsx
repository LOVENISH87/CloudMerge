import { useCallback, useEffect, useState } from "react";
import { theme } from "../theme";
import type { View } from "../types";
import { Sidebar } from "../components/Sidebar";
import { QuotaView } from "../components/QuotaView";
import { FilesView } from "../components/FilesView";
import { SettingsView } from "../components/SettingsView";
import { UploadPanel } from "../components/UploadPanel";
import type { UploadState } from "../components/UploadPanel";
import { ContextMenu } from "../components/ContextMenu";
import type { MenuState } from "../components/ContextMenu";
import { storageApi } from "../api/resources";
import type { StorageSummary } from "../api/types";
import { formatGB } from "../utils/format";

export type { View };

export function Dashboard() {
  const [activeView, setActiveView] = useState<View>(
    new URLSearchParams(window.location.search).has("connected") ? "settings" : "files"
  );
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);

  const refreshSummary = useCallback(() => {
    storageApi.summary().then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const onUploadDone = () => {
    setFilesRefreshKey((k) => k + 1);
    refreshSummary();
  };

  const poolSummary = summary
    ? `pool: ${formatGB(summary.usedBytes)} / ${formatGB(summary.totalBytes)}`
    : "pool: —";

  const titles: Record<View, string> = { quota: "QUOTA TRACKER", files: "ALL FILES", settings: "CONNECTED ACCOUNTS" };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.sans,
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      <Sidebar activeView={activeView} setView={setActiveView} poolSummary={poolSummary} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.panel,
          }}
        >
          <span style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>{titles[activeView]}</span>
          <span style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>cloudmerge v1.0</span>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24, paddingBottom: 24 }}>
          {activeView === "quota" && <QuotaView summary={summary} />}
          {activeView === "files" && (
            <FilesView refreshKey={filesRefreshKey} onContextMenu={setMenu} onUploadStart={setUpload} onUploadProgress={setUpload} onUploadDone={onUploadDone} />
          )}
          {activeView === "settings" && <SettingsView summary={summary} onChange={refreshSummary} />}
        </div>
      </div>

      {upload && <UploadPanel upload={upload} />}
      {menu && <ContextMenu menu={menu} onClose={() => setMenu(null)} onChanged={onUploadDone} />}
    </div>
  );
}
