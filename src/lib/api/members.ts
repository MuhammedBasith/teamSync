// Frontend API functions for members
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getMembers() {
  return apiClient("/members", { method: "GET" });
}

export async function inviteMember(data: { email: string; role: string }) {
  return apiClient("/invite", { method: "POST", body: data });
}

export async function updateMemberRole(id: string, role: string) {
  return apiClient(`/members/${id}`, { method: "PATCH", body: { role } });
}

export async function removeMember(id: string) {
  return apiClient(`/members/${id}`, { method: "DELETE" });
}

