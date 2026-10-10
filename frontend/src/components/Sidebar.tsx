import type { View } from "../types";
import { HardDrive, FolderOpen, Settings, Cloud } from "lucide-react";
import { Button } from "@nextui-org/react";

export function Sidebar({ active, onSelect }: { active: View; onSelect: (v: View) => void }) {
  const nav = [
    { id: "files", label: "All Files", icon: <FolderOpen size={18} /> },
    { id: "quota", label: "Quota Tracker", icon: <HardDrive size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ] as const;

  return (
    <aside className="w-64 bg-content1 border-r border-divider flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-divider gap-3 text-primary">
        <Cloud fill="currentColor" size={24} />
        <span className="font-bold text-lg tracking-tight text-foreground">CloudMerge</span>
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {nav.map((item) => {
          const isActive = active === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "flat" : "light"}
              color={isActive ? "primary" : "default"}
              className={`justify-start px-4 h-11 font-medium ${isActive ? "bg-primary/10 text-primary" : "text-default-500 hover:text-foreground"}`}
              startContent={<span className={isActive ? "text-primary" : "text-default-400"}>{item.icon}</span>}
              onPress={() => onSelect(item.id)}
            >
              {item.label}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-divider">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-md">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">My Workspace</span>
            <span className="text-xs text-default-400">Pro Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
