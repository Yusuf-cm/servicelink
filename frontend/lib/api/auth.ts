import { api } from "./client";
import type { User, Role } from "@/lib/types";

export interface RegisterPayload {
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  role: Role;
  password: string;
  password_confirm: string;
}

export function register(payload: RegisterPayload) {
  return api.post<{ user: User; detail: string }>("/auth/register/", payload, { skipAuth: true });
}

export function verifyEmail(email: string, code: string) {
  return api.post<{ detail: string }>("/auth/verify-email/", { email, code }, { skipAuth: true });
}

export function getMe() {
  return api.get<User>("/auth/me/");
}

export function updateMe(payload: Partial<Pick<User, "first_name" | "last_name" | "phone_number">>) {
  return api.patch<User>("/auth/me/", payload);
}

export function changePassword(old_password: string, new_password: string) {
  return api.post<{ detail: string }>("/auth/change-password/", { old_password, new_password });
}
