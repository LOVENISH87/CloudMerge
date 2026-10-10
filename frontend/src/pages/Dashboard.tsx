import { useCallback, useEffect, useState } from "react";
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
import { Divider } from "@nextui-org/react";

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

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <Sidebar active={activeView} onSelect={setActiveView} />
      
      <Divider orientation="vertical" />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-content1/30">
        <header className="h-14 min-h-[56px] border-b border-divider flex items-center px-6 justify-between bg-content1/50 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90 capitalize">{activeView.replace("-", " ")}</h1>
          <div className="font-mono text-xs text-default-500 font-medium tracking-wide bg-content2 px-3 py-1.5 rounded-full border border-divider">
            {poolSummary}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeView === "quota" && <QuotaView summary={summary} />}
            {activeView === "files" && (
              <FilesView
                refreshKey={filesRefreshKey}
                onContextMenu={setMenu}
                onUploadStart={setUpload}
                onUploadProgress={setUpload}
                onUploadDone={onUploadDone}
              />
            )}
            {activeView === "settings" && <SettingsView summary={summary} onChange={refreshSummary} />}
          </div>
        </div>

        {upload && (
          <div className="absolute bottom-6 right-6 shadow-2xl rounded-xl overflow-hidden border border-divider bg-content1">
             <UploadPanel upload={upload} />
          </div>
        )}
      </main>

      {menu && <ContextMenu menu={menu} onClose={() => setMenu(null)} onChanged={() => setFilesRefreshKey(k => k + 1)} />}
    </div>
  );
}
