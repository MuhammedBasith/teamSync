// Frontend API functions for teams
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getTeams() {
  return apiClient("/teams", { method: "GET" });
}

export async function getTeam(id: string) {
  return apiClient(`/teams/${id}`, { method: "GET" });
}

export async function createTeam(data: unknown) {
  return apiClient("/teams", { method: "POST", body: data });
}

export async function updateTeam(id: string, data: unknown) {
  return apiClient(`/teams/${id}`, { method: "PATCH", body: data });
}

export async function deleteTeam(id: string) {
  return apiClient(`/teams/${id}`, { method: "DELETE" });
}

