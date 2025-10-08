/**
 * Global query client reference for cache management
 * This allows us to clear the cache from anywhere in the app
 */

import { QueryClient } from "@tanstack/react-query";

let globalQueryClient: QueryClient | null = null;

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client;
}

export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient;
}

export function clearAllQueries() {
  if (globalQueryClient) {
    try {
      globalQueryClient.clear();
    } catch (error) {
      console.error("Failed to clear queries:", error);
    }
  }
}

