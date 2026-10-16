import "server-only";
import { cache } from "react";
import type { AdminProfile } from "@kisa/shared";
import { apiFetch } from "./api";

/** The signed-in admin, fetched once per request (layout and pages share it). */
export const getMe = cache(() => apiFetch<AdminProfile>("/admin/me"));

/** ADMIN can change everything; STAFF can view and adjust stock. The API enforces the same rules. */
export const canEdit = (me: AdminProfile) => me.role === "ADMIN";
