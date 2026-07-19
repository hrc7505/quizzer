/**
 * Unified API client for the Quizzer application.
 * Provides typed, consistent HTTP methods with error handling.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JSONValue = any;

interface ApiResponse<T = JSONValue> {
  data: T | null;
  error: string | null;
  success: boolean;
  status: number;
}

interface RequestOptions {
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Custom headers to merge */
  headers?: Record<string, string>;
  /** Base URL override (defaults to same-origin) */
  baseUrl?: string;
}

type RequestBody = Record<string, unknown> | unknown[] | FormData | null;

/**
 * Core request function.
 */
async function request<T = JSONValue>(
  method: string,
  url: string,
  body?: RequestBody,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  // Only set Content-Type for JSON bodies, not FormData
  if (!isFormData && body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    const status = res.status;
    let data: T | null = null;
    let error: string | null = null;

    // Try to parse JSON response
    try {
      const json = await res.json();
      if (json.error) {
        error = json.error;
      } else {
        data = json as T;
      }
    } catch {
      // Response is not JSON
      if (!res.ok) {
        error = `Request failed with status ${status}`;
      }
    }

    return {
      data,
      error,
      success: res.ok && !error,
      status,
    };
  } catch (err: unknown) {
    // Handle network errors and abort errors
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        data: null,
        error: null,
        success: false,
        status: 0,
      };
    }

    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
      success: false,
      status: 0,
    };
  }
}

/**
 * API utility with typed HTTP methods.
 *
 * @example
 * ```ts
 * import { api } from "@/lib/api";
 *
 * // GET
 * const { data, error } = await api.get<Quiz[]>("/api/admin/quizzes");
 *
 * // POST with body
 * const { data, error } = await api.post<Quiz>("/api/admin/quizzes", { title: "..." });
 *
 * // With AbortController
 * const controller = new AbortController();
 * const { data } = await api.get("/api/slow", { signal: controller.signal });
 * controller.abort();
 * ```
 */
export const api = {
  get<T = JSONValue>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("GET", url, undefined, options);
  },

  post<T = JSONValue>(url: string, body?: RequestBody, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("POST", url, body, options);
  },

  put<T = JSONValue>(url: string, body?: RequestBody, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("PUT", url, body, options);
  },

  patch<T = JSONValue>(url: string, body?: RequestBody, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("PATCH", url, body, options);
  },

  delete<T = JSONValue>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("DELETE", url, undefined, options);
  },
};

export type { ApiResponse, RequestOptions, JSONValue };