// API client configuration for frontend API calls
// This is a simple wrapper around fetch for making API calls

type ApiClientOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`/api${endpoint}`, config);

  if (!response.ok) {
    // Try to extract error message from response body
    let errorMessage = response.statusText;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || response.statusText;
    } catch (parseError) {
      // If JSON parsing fails, use status text (already set above)
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

