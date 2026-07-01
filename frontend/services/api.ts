import { config } from "@/lib/config";

/**
 * Base API client — placeholder for FastAPI backend integration (Phase 2+)
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient(config.api.baseUrl);

/** Health check — will connect to FastAPI in Phase 2 */
export async function checkApiHealth(): Promise<{ status: string }> {
  try {
    return await apiClient.get("/health");
  } catch {
    return { status: "unavailable" };
  }
}
