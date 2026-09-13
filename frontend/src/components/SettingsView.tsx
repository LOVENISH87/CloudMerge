import { useEffect, useState } from "react";
import { theme } from "../theme";
import type { StorageSummary } from "../api/types";
import { connectedAccountsApi } from "../api/resources";
import { formatGB } from "../utils/format";
import { GoogleIcon } from "./GoogleIcon";
import { Button } from "./Button";

export function SettingsView({ summary, onChange }: { summary: StorageSummary | null; onChange: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("connected")) {
      const ok = params.get("connected") === "1";
      setNotice(ok ? "Account connected" : `Connect failed: ${params.get("error") ?? "unknown error"}`);
      window.history.replaceState({}, "", window.location.pathname);
      onChange();
    }
  }, [onChange]);

  const connectDrive = async () => {
    setConnecting(true);
    try {
      const { url } = await connectedAccountsApi.getConnectUrl();
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  };

  const disconnect = async (id: string) => {
    if (!window.confirm("Disconnect this account? Files stored there will become inaccessible.")) return;
    await connectedAccountsApi.delete(id);
    onChange();
  };

  const sync = async (id: string) => {
    setSyncingId(id);
    try {
      await connectedAccountsApi.syncQuota(id);
      onChange();
    } catch (err) {
      setNotice(`Sync failed: ${(err as Error).message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const accounts = summary?.accounts ?? [];

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted, marginBottom: 20 }}>
        connected accounts feed a single merged storage pool
      </div>

      {notice && (
        <div
          style={{
            fontFamily: theme.mono,
            fontSize: 12,
            color: notice.startsWith("Connect failed") || notice.startsWith("Sync failed") ? theme.danger : theme.accent,
            marginBottom: 16,
            padding: "8px 12px",
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
          }}
        >
          {notice}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {accounts.length === 0 && (
          <div style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>no accounts connected yet</div>
        )}
        {accounts.map((acc) => {
          const total = Number(acc.totalBytes);
          const used = Number(acc.usedBytes);
          const exceeded = total > 0 && used > total;
          const unsynced = total === 0;
          return (
            <div
              key={acc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                borderLeft: exceeded ? `3px solid ${theme.danger}` : `3px solid transparent`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GoogleIcon size={16} />
                <div>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{acc.googleAccountEmail}</div>
                  <div style={{ fontFamily: theme.mono, fontSize: 11, color: exceeded ? theme.danger : theme.muted }}>
                    {unsynced ? "not synced yet" : `${formatGB(acc.usedBytes)} / ${formatGB(acc.totalBytes)} used`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  onClick={() => sync(acc.id)}
                  style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
                >
                  {syncingId === acc.id ? "syncing..." : "sync"}
                </span>
                <span
                  onClick={() => disconnect(acc.id)}
                  style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.muted)}
                >
                  disconnect
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: theme.panel,
            border: `1px solid ${theme.accent}`,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <span style={{ fontFamily: theme.mono, fontSize: 12 }}>
            merged pool: {formatGB(summary!.usedBytes)} / {formatGB(summary!.totalBytes)}
          </span>
        </div>
      )}

      <Button variant="primary" disabled={connecting} onClick={connectDrive}>
        <GoogleIcon size={14} />
        {connecting ? "redirecting..." : "connect another drive"}
      </Button>
    </div>
  );
}
