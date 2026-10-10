import { useEffect, useRef, useState, useMemo } from "react";
import { filesApi, connectedAccountsApi } from "../api/resources";
import type { FileItem } from "../api/types";
import { formatBytes, formatDate } from "../utils/format";
import { uploadFile } from "../api/upload";
import type { MenuState } from "./ContextMenu";
import type { UploadState } from "./UploadPanel";
import { File, Image as ImageIcon, FileText, Video, FileArchive, Folder, Search, Grid, List } from "lucide-react";
import { 
  Button, 
  Input, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Card, 
  CardBody, 
  CardFooter,
  Pagination,
  ButtonGroup,
  Chip
} from "@nextui-org/react";

// Pre-defined color palette for drives
const DRIVE_COLORS = [
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
] as const;

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
  const [accountsMeta, setAccountsMeta] = useState<Record<string, { email: string, colorIndex: number }>>({});
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
        const map: Record<string, { email: string, colorIndex: number }> = {};
        accounts.forEach((a, index) => {
          map[a.id] = {
            email: a.googleAccountEmail.split("@")[0],
            colorIndex: index % DRIVE_COLORS.length
          };
        });
        setAccountsMeta(map);
      })
      .catch(() => {});
  }, [refreshKey]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [files, search]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE) || 1;
  const paginatedFiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredFiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFiles, page]);

  useEffect(() => setPage(1), [search]);

  const handleFilePicked = async (file: globalThis.File) => {
    onUploadStart({ fileName: file.name, pct: 0 });
    try {
      await uploadFile(file, null, (pct) => onUploadProgress({ fileName: file.name, pct }));
      onUploadProgress({ fileName: file.name, pct: 100, done: true });
      onUploadDone();
    } catch (err) {
      onUploadProgress({ fileName: file.name, pct: 0, error: (err as Error).message });
      setTimeout(() => onUploadDone(), 5000); 
    }
  };

  const getFileIcon = (mimeType: string, size: number) => {
    if (mimeType.includes("image/")) return <ImageIcon size={size} className="text-primary" />;
    if (mimeType.includes("video/")) return <Video size={size} className="text-danger" />;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText size={size} className="text-blue-500" />;
    if (mimeType.includes("zip") || mimeType.includes("tar")) return <FileArchive size={size} className="text-yellow-500" />;
    if (mimeType === "application/vnd.google-apps.folder") return <Folder size={size} className="text-primary fill-primary" />;
    return <File size={size} className="text-default-500" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full px-2">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 font-mono text-sm text-default-500">
          <span className="font-semibold text-foreground">CloudMerge</span>
          <span>/</span>
          <span>All Files</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Input
            classNames={{
              base: "w-64",
              input: "text-sm",
            }}
            placeholder="Search files..."
            size="sm"
            startContent={<Search size={16} className="text-default-400" />}
            value={search}
            onValueChange={setSearch}
            isClearable
          />

          <ButtonGroup size="sm" variant="flat">
            <Button isIconOnly onPress={() => setViewMode("list")} className={viewMode === "list" ? "bg-default-200" : ""}>
              <List size={16} />
            </Button>
            <Button isIconOnly onPress={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-default-200" : ""}>
              <Grid size={16} />
            </Button>
          </ButtonGroup>

          <Button color="primary" size="sm" onPress={() => fileInput.current?.click()} className="font-semibold">
            + Upload
          </Button>
          <input ref={fileInput} type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFilePicked(file); e.target.value = ""; }} />
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto pb-6 pr-2">
        {paginatedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-default-400">
            <Folder size={64} className="opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedFiles.map(f => {
              const sel = selected === f.id;
              const meta = accountsMeta[f.connectedAccountId];
              return (
                <Card 
                  key={f.id} 
                  isPressable 
                  isHoverable
                  onPress={() => setSelected(f.id)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(f.id); onContextMenu({ x: e.clientX, y: e.clientY, file: f }); }}
                  className={`border-2 transition-all ${sel ? "border-primary bg-content2" : "border-transparent bg-content1"}`}
                  shadow="sm"
                >
                  <CardBody className="flex flex-col items-center justify-center py-6 overflow-hidden">
                    {getFileIcon(f.mimeType, 48)}
                  </CardBody>
                  <CardFooter className="flex flex-col items-start px-4 pb-4 pt-0 gap-1.5 overflow-hidden">
                    <p className="text-xs font-semibold text-foreground truncate w-full" title={f.name}>{f.name}</p>
                    <div className="flex justify-between w-full items-center">
                      <p className="text-[10px] text-default-500">{formatBytes(f.sizeBytes)}</p>
                      {meta && (
                        <Chip size="sm" variant="flat" color={DRIVE_COLORS[meta.colorIndex]} className="text-[9px] h-4 px-1" title={`Stored on ${meta.email}`}>
                          Drive {meta.colorIndex + 1}
                        </Chip>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Table 
            aria-label="Files table" 
            selectionMode="single" 
            color="primary"
            selectedKeys={selected ? [selected] : []}
            onRowAction={(key) => setSelected(key as string)}
            classNames={{ wrapper: "bg-content1", td: "py-3" }}
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>DRIVE</TableColumn>
              <TableColumn>SIZE</TableColumn>
              <TableColumn>MODIFIED</TableColumn>
            </TableHeader>
            <TableBody items={paginatedFiles}>
              {(f) => {
                const meta = accountsMeta[f.connectedAccountId];
                return (
                  <TableRow 
                    key={f.id} 
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(f.id); onContextMenu({ x: e.clientX, y: e.clientY, file: f }); }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(f.mimeType, 20)}
                        <span className="text-sm truncate max-w-[300px]">{f.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {meta ? (
                        <Chip size="sm" variant="flat" color={DRIVE_COLORS[meta.colorIndex]}>
                          {meta.email}
                        </Chip>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{formatBytes(f.sizeBytes)}</TableCell>
                    <TableCell className="text-sm text-default-500">{formatDate(f.createdAt)}</TableCell>
                  </TableRow>
                )
              }}
            </TableBody>
          </Table>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center py-4 mt-auto border-t border-divider">
        <p className="text-xs text-default-500 font-mono">
          {filteredFiles.length} files total
        </p>
        
        {totalPages > 1 && (
          <Pagination 
            isCompact 
            showControls 
            color="primary" 
            page={page} 
            total={totalPages} 
            onChange={setPage} 
          />
        )}
      </div>
    </div>
  );
}
