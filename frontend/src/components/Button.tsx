import type { ReactNode, CSSProperties } from "react";
import { theme } from "../theme";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "google";
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}

export function Button({ children, onClick, variant = "primary", disabled, type = "button", style }: ButtonProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "9px 16px",
    fontFamily: theme.mono,
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 6,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "background 120ms ease, border-color 120ms ease",
    border: "1px solid transparent",
  };

  const variants: Record<string, CSSProperties> = {
    primary: { background: theme.accent, color: "#08120e", borderColor: theme.accent },
    ghost: { background: "transparent", color: theme.text, borderColor: theme.border },
    google: { background: "#fff", color: "#1f1f1f", borderColor: "#fff" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = theme.accentHover;
        if (variant === "ghost") e.currentTarget.style.borderColor = theme.accent;
        if (variant === "google") e.currentTarget.style.background = "#f2f2f2";
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") e.currentTarget.style.background = theme.accent;
        if (variant === "ghost") e.currentTarget.style.borderColor = theme.border;
        if (variant === "google") e.currentTarget.style.background = "#fff";
      }}
    >
      {children}
    </button>
  );
}
