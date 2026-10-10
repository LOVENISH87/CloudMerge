import type { ReactNode } from "react";
import { theme } from "../theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "google";
  children: ReactNode;
}

export function Button({ variant = "secondary", children, style, disabled, ...props }: ButtonProps) {
  let bg: string = theme.panel;
  let color: string = theme.text;
  let border: string = `1px solid ${theme.border}`;
  let hoverBg: string = "rgba(255, 255, 255, 0.1)";

  if (variant === "primary") {
    bg = theme.accent;
    color = "#fff";
    border = `1px solid ${theme.accent}`;
    hoverBg = "#157758"; 
  } else if (variant === "danger") {
    bg = "transparent";
    color = "#E53935";
    border = "1px solid #E53935";
    hoverBg = "rgba(229, 57, 53, 0.1)";
  } else if (variant === "ghost") {
    bg = "transparent";
    color = theme.text;
    border = "1px solid transparent";
    hoverBg = theme.panel;
  } else if (variant === "google") {
    bg = "#fff";
    color = "#000";
    border = "1px solid #ddd";
    hoverBg = "#f5f5f5";
  }

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        background: disabled ? theme.border : bg,
        color: disabled ? theme.muted : color,
        border: disabled ? `1px solid transparent` : border,
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.15s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = bg;
      }}
    >
      {children}
    </button>
  );
}
