// Frontend API functions for organization
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getOrganization() {
  return apiClient("/organization", { method: "GET" });
}

export async function updateOrganization(data: unknown) {
  return apiClient("/organization", { method: "PATCH", body: data });
}

