// Utility exports
export * from "./roleUtils";
export * from "./constants";
export * from "./fetcher";

// Helper function to generate avatar URL using Avatar Placeholder API
export function getAvatarUrl(name: string): string {
  return `https://avatar-placeholder.iran.liara.run/?name=${encodeURIComponent(
    name
  )}`;
}

// Helper function to format date
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to format date time
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

