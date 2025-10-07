// Server-side logging utility
// This file should only be used in API routes

type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
}

export function logInfo(message: string, data?: unknown) {
  log("info", message, data);
}

export function logWarn(message: string, data?: unknown) {
  log("warn", message, data);
}

export function logError(message: string, data?: unknown) {
  log("error", message, data);
}

