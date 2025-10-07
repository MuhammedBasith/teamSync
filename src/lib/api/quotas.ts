// Frontend API functions for quotas
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getQuotas() {
  return apiClient("/quotas", { method: "GET" });
}

