import { useToast } from "./ToastProvider";
import { Alert } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80 max-w-[calc(100vw-32px)]">
      <AnimatePresence>
        {toasts.map((t) => {
          let color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" = "default";
          if (t.type === "success") color = "success";
          if (t.type === "error") color = "danger";
          if (t.type === "warning") color = "warning";
          if (t.type === "info") color = "primary";

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Alert 
                color={color}
                title={t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                description={t.message}
                variant="faded"
                onClose={() => removeToast(t.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
