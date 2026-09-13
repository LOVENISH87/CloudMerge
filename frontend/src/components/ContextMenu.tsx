import { theme } from "../theme";
import type { FileItem } from "../api/types";
import { filesApi } from "../api/resources";
import { API_URL, getAccessToken } from "../api/client";

export interface MenuState {
  x: number;
  y: number;
  file: FileItem;
}

async function downloadFile(file: FileItem, token: string | null) {
  const res = await fetch(`${API_URL}/files/${file.id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ContextMenu({ menu, onClose, onChanged }: { menu: MenuState; onClose: () => void; onChanged: () => void }) {
  const { file } = menu;

  const items = [
    {
      label: "open",
      color: theme.text,
      onClick: async () => {
        const { url } = await filesApi.viewUrl(file.id);
        window.open(url, "_blank");
      },
    },
    {
      label: "rename",
      color: theme.text,
      onClick: async () => {
        const name = window.prompt("New name", file.name);
        if (name && name !== file.name) {
          await filesApi.rename(file.id, name);
          onChanged();
        }
      },
    },
    {
      label: "move to...",
      color: theme.text,
      onClick: async () => {
        const folderId = window.prompt("Target folder id (blank = root)", file.folderId ?? "");
        if (folderId !== null) {
          await filesApi.move(file.id, folderId || null);
          onChanged();
        }
      },
    },
    {
      label: "download",
      color: theme.text,
      onClick: () => downloadFile(file, getAccessToken()),
    },
    {
      label: "delete",
      color: theme.danger,
      onClick: async () => {
        if (window.confirm(`Delete "${file.name}"?`)) {
          await filesApi.delete(file.id);
          onChanged();
        }
      },
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: menu.y,
        left: menu.x,
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        minWidth: 140,
        zIndex: 100,
        fontFamily: theme.mono,
        fontSize: 12,
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((mi) => (
        <div
          key={mi.label}
          onClick={async () => {
            await mi.onClick();
            onClose();
          }}
          style={{ padding: "8px 12px", color: mi.color, cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.border)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {mi.label}
        </div>
      ))}
    </div>
  );
}
