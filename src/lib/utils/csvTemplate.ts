/**
 * CSV Template utilities for bulk invite
 */

export const CSV_TEMPLATE_HEADERS = ["email", "role"];

/**
 * Generate CSV template content
 */
export function generateCSVTemplate(): string {
  const headers = CSV_TEMPLATE_HEADERS.join(",");
  const examples = [
    "john.doe@example.com,member",
    "jane.smith@example.com,member",
    "bob.wilson@example.com,member",
  ];
  return `${headers}\n${examples.join("\n")}`;
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(): void {
  const content = generateCSVTemplate();
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", "bulk-invite-template.csv");
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): {
  success: boolean;
  data?: Array<{ email: string; role: string }>;
  errors?: string[];
} {
  try {
    const lines = content.trim().split("\n");
    
    if (lines.length < 2) {
      return {
        success: false,
        errors: ["CSV file is empty or has no data rows"],
      };
    }

    // Check headers
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    if (!headers.includes("email")) {
      return {
        success: false,
        errors: ['CSV must have an "email" column'],
      };
    }

    const emailIndex = headers.indexOf("email");
    const roleIndex = headers.indexOf("role");

    // Parse data rows
    const data: Array<{ email: string; role: string }> = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const columns = line.split(",").map((c) => c.trim());
      const email = columns[emailIndex];
      const role = roleIndex >= 0 ? columns[roleIndex] : "member";

      if (!email) {
        errors.push(`Row ${i + 1}: Email is missing`);
        continue;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
        continue;
      }

      // Role validation (only member allowed for bulk invite)
      if (role && role.toLowerCase() !== "member") {
        errors.push(
          `Row ${i + 1}: Only "member" role is allowed in bulk invites, found "${role}"`
        );
        continue;
      }

      data.push({
        email: email.toLowerCase(),
        role: "member", // Always member for bulk invites
      });
    }

    // Check for duplicates within the CSV
    const emailSet = new Set<string>();
    const duplicates: string[] = [];
    
    data.forEach((item) => {
      if (emailSet.has(item.email)) {
        duplicates.push(`Duplicate email: ${item.email}`);
      } else {
        emailSet.add(item.email);
      }
    });

    if (duplicates.length > 0) {
      errors.push(...duplicates);
    }

    if (errors.length > 0) {
      return {
        success: false,
        data,
        errors,
      };
    }

    if (data.length === 0) {
      return {
        success: false,
        errors: ["No valid rows found in CSV"],
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}


