import { Progress } from "@nextui-org/react";
import { CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface UploadState {
  fileName: string;
  pct: number;
  done?: boolean;
  error?: string;
}

export function UploadPanel({ upload }: { upload: UploadState }) {
  const { fileName, pct, done, error } = upload;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-80 p-4 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-success/20 text-success' : error ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
              {done ? <CheckCircle2 size={16} /> : error ? <AlertCircle size={16} /> : <FileUp size={16} />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-foreground truncate" title={fileName}>
                {fileName}
              </span>
              <span className="text-xs text-default-500">
                {done ? "Complete" : error ? "Failed" : `Uploading... ${Math.round(pct)}%`}
              </span>
            </div>
          </div>
        </div>

        {!done && !error && (
          <Progress 
            size="sm" 
            color="primary" 
            value={pct} 
            className="w-full"
            classNames={{ indicator: "transition-all duration-300 ease-in-out" }}
          />
        )}
        
        {error && (
          <div className="text-xs text-danger bg-danger/10 p-2 rounded-md border border-danger/20 break-words">
            {error}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
