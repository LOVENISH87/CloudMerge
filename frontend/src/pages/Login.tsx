import { useState } from "react";
import type { FormEvent } from "react";
import { theme } from "../theme";
import { useAuth } from "../auth/AuthContext";
import { connectedAccountsApi } from "../api/resources";
import { GoogleIcon } from "../components/GoogleIcon";
import { Button } from "../components/Button";

export function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const loginError = params.get("loginError");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { url } = await connectedAccountsApi.getLoginUrl();
      window.location.href = url;
    } catch {
      setGoogleBusy(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `radial-gradient(circle at 50% 0%, rgba(29,158,117,0.08), transparent 60%)`,
      }}
    >
      <div
        style={{
          width: 340,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <span style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>CLOUDMERGE</span>
          <span style={{ fontFamily: theme.sans, fontSize: 12, color: theme.muted }}>pool every Google Drive account into one</span>
        </div>

        {loginError && (
          <span style={{ fontFamily: theme.mono, fontSize: 11, color: theme.danger }}>{decodeURIComponent(loginError)}</span>
        )}

        <Button variant="google" disabled={googleBusy} onClick={continueWithGoogle} style={{ width: "100%", padding: "10px 16px" }}>
          <GoogleIcon size={16} />
          {googleBusy ? "redirecting..." : "Continue with Google"}
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <span style={{ fontFamily: theme.mono, fontSize: 10, color: theme.muted }}>or</span>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
          />

          {error && <span style={{ fontFamily: theme.mono, fontSize: 11, color: theme.danger }}>{error}</span>}

          <Button type="submit" disabled={busy} variant="ghost" style={{ width: "100%" }}>
            {busy ? "..." : mode === "login" ? "log in" : "create account"}
          </Button>

          <span
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted, cursor: "pointer", textAlign: "center" }}
          >
            {mode === "login" ? "need an account? register" : "have an account? log in"}
          </span>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0a0a0a",
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  padding: "9px 10px",
  color: theme.text,
  fontFamily: theme.sans,
  fontSize: 13,
  outline: "none",
};
