import { theme } from "../theme";
import type { StorageSummary } from "../api/types";
import { formatGB } from "../utils/format";

export function QuotaView({ summary }: { summary: StorageSummary | null }) {
  if (!summary) return null;

  const accounts = summary.accounts.map((a) => {
    const total = Number(a.totalBytes);
    const used = Number(a.usedBytes);
    const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    const exceeded = used > total && total > 0;
    return {
      email: a.googleAccountEmail,
      usedLabel: formatGB(a.usedBytes),
      totalLabel: formatGB(a.totalBytes),
      pctLabel: total > 0 ? Math.round((used / total) * 100) + "%" : "—",
      pctWidth: pct + "%",
      barColor: exceeded ? theme.danger : theme.accent,
      labelColor: exceeded ? theme.danger : theme.muted,
      dangerBorder: exceeded ? `2px solid ${theme.danger}` : "none",
      exceeded,
    };
  });

  const totalPct = Number(summary.totalBytes) > 0 ? (Number(summary.usedBytes) / Number(summary.totalBytes)) * 100 : 0;

  if (accounts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted, marginBottom: 16 }}>
        {summary.accountCount} connected accounts &middot; merged into one pool
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
        {accounts.map((acc) => (
          <div key={acc.email} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: theme.text }}>{acc.email}</span>
                <span style={{ fontFamily: theme.mono, fontSize: 12, color: acc.labelColor }}>
                  {acc.usedLabel} / {acc.totalLabel} &middot; {acc.pctLabel}
                </span>
              </div>
              <div style={{ height: 8, background: theme.border, borderRadius: 4, overflow: "hidden", borderLeft: acc.dangerBorder }}>
                <div style={{ height: "100%", background: acc.barColor, width: acc.pctWidth, transition: "width 200ms ease" }} />
              </div>
              {acc.exceeded && (
                <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.danger, marginTop: 4 }}>
                  quota exceeded &mdash; uploads paused for this account
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>COMBINED POOL</span>
          <span style={{ fontFamily: theme.mono, fontSize: 13, color: theme.accent }}>
            {formatGB(summary.usedBytes)} / {formatGB(summary.totalBytes)} &middot; {Math.round(totalPct)}%
          </span>
        </div>
        <div style={{ height: 8, background: theme.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: theme.accent, width: Math.min(100, totalPct) + "%", transition: "width 200ms ease" }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
      no connected accounts yet &mdash; go to settings to connect a Google Drive account
    </div>
  );
}
