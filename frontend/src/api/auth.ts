import { api } from "./client";

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export const authApi = {
  register: (email: string, password: string) =>
    api<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    api<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  me: () => api<{ id: string; email: string; createdAt: string }>("/auth/me"),
};
