import { useEffect, useState } from "react";
import type { StorageSummary } from "../api/types";
import { connectedAccountsApi } from "../api/resources";
import { formatGB } from "../utils/format";
import { GoogleIcon } from "./GoogleIcon";
import { Button, Card, CardBody, Badge } from "@nextui-org/react";
import { useToast } from "./ToastProvider";
import { RefreshCw, Trash2, Link } from "lucide-react";

export function SettingsView({ summary, onChange }: { summary: StorageSummary | null; onChange: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("connected")) {
      const ok = params.get("connected") === "1";
      if (ok) {
        addToast("Google Account successfully connected!", "success");
      } else {
        addToast(`Connect failed: ${params.get("error") ?? "unknown error"}`, "error");
      }
      window.history.replaceState({}, "", window.location.pathname);
      onChange();
    }
  }, [onChange, addToast]);

  const connectDrive = async () => {
    setConnecting(true);
    try {
      const { url } = await connectedAccountsApi.getConnectUrl();
      window.location.href = url;
    } catch {
      setConnecting(false);
      addToast("Failed to generate connect URL", "error");
    }
  };

  const disconnect = async (id: string) => {
    if (!window.confirm("Disconnect this account? Files stored there will become inaccessible.")) return;
    try {
      await connectedAccountsApi.delete(id);
      addToast("Account disconnected successfully", "success");
      onChange();
    } catch (err) {
      addToast(`Disconnect failed: ${(err as Error).message}`, "error");
    }
  };

  const sync = async (id: string) => {
    setSyncingId(id);
    try {
      await connectedAccountsApi.syncQuota(id);
      addToast("Quota and files synced successfully!", "success");
      onChange();
    } catch (err) {
      addToast(`Sync failed: ${(err as Error).message}`, "error");
    } finally {
      setSyncingId(null);
    }
  };

  const accounts = summary?.accounts ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold mb-1">Connected Accounts</h2>
          <p className="text-sm text-default-500 font-mono">
            Connected accounts feed a single merged storage pool
          </p>
        </div>
        <Button 
          color="primary" 
          startContent={<GoogleIcon />} 
          isLoading={connecting}
          onPress={connectDrive}
          className="font-medium"
        >
          Connect Google Account
        </Button>
      </div>

      <div className="grid gap-4 mt-6">
        {accounts.length === 0 ? (
          <Card className="bg-content2/50 border border-divider shadow-none">
            <CardBody className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Link size={48} className="text-default-300" />
              <p className="text-default-500">No accounts connected yet.<br/>Connect your first Google Drive to start merging storage.</p>
            </CardBody>
          </Card>
        ) : (
          accounts.map((a) => (
            <Card key={a.id} className="border border-divider shadow-sm" shadow="none">
              <CardBody className="p-4 flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <GoogleIcon />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{a.googleAccountEmail}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge color={Number(a.usedBytes) > Number(a.totalBytes) * 0.9 ? "danger" : "success"} variant="flat" size="sm">
                      {formatGB(a.usedBytes)} / {formatGB(a.totalBytes)} used
                    </Badge>
                    {a.lastSyncedAt && (
                      <span className="text-xs text-default-400 font-mono">
                        Synced: {new Date(a.lastSyncedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="flat" 
                    isLoading={syncingId === a.id}
                    startContent={syncingId !== a.id && <RefreshCw size={14} />}
                    onPress={() => sync(a.id)}
                  >
                    Sync
                  </Button>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="light" 
                    isIconOnly
                    onPress={() => disconnect(a.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
