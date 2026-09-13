import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { theme } from "./theme";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: "100vh", background: theme.bg, color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.mono, fontSize: 12 }}>
        loading...
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
