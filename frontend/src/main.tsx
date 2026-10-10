import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import { ToastProvider } from "./components/ToastProvider.tsx";
import { ToastContainer } from "./components/ToastContainer.tsx";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextUIProvider>
      <ToastProvider>
        <main className="dark text-foreground bg-background min-h-screen relative">
          <App />
          <ToastContainer />
        </main>
      </ToastProvider>
    </NextUIProvider>
  </StrictMode>
);
