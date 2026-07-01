import { config } from "@/lib/config";

export async function authenticatedFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string | null | undefined;
  }
): Promise<T> {
  const url = `${config.api.baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
