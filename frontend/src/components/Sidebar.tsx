import { theme } from "../theme";
import type { View } from "../types";

const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "all files", view: "files" },
  { label: "quota tracker", view: "quota" },
  { label: "settings", view: "settings" },
];

export function Sidebar({
  activeView,
  setView,
  poolSummary,
}: {
  activeView: View;
  setView: (v: View) => void;
  poolSummary: string;
}) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: theme.bg,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 48, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: theme.text }}>
          CLOUDMERGE
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
        {NAV_ITEMS.map((item) => {
          const active = item.view === activeView;
          return (
            <div
              key={item.view}
              onClick={() => setView(item.view)}
              style={{
                display: "flex",
                alignItems: "center",
                height: 36,
                padding: "0 16px",
                cursor: "pointer",
                borderLeft: active ? `2px solid ${theme.accent}` : "2px solid transparent",
                background: active ? theme.panel : "transparent",
                color: active ? theme.text : theme.muted,
              }}
            >
              <span style={{ fontFamily: theme.mono, fontSize: 12 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "auto", padding: 16, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>{poolSummary}</div>
      </div>
    </div>
  );
}
