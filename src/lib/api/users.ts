// Frontend API functions for users
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getUser(id: string) {
  return apiClient(`/members/${id}`, { method: "GET" });
}

export async function updateUser(id: string, data: unknown) {
  return apiClient(`/members/${id}`, { method: "PATCH", body: data });
}

export async function deleteUser(id: string) {
  return apiClient(`/members/${id}`, { method: "DELETE" });
}

