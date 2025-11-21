import { apiRequest } from "./queryClient";
import type {
  User,
  LoginCredentials,
  InsertUser,
  ChangePassword,
} from "@shared/schema";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", credentials);
  return (await res.json()) as User;
}

export async function register(data: InsertUser): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return (await res.json()) as User;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}

export async function changePassword(data: ChangePassword): Promise<void> {
  await apiRequest("POST", "/api/auth/change-password", data);
}
