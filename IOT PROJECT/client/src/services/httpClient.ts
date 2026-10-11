/**
 * Robust HTTP Client with request timeouts, exponential backoff retries,
 * network failure resilience, and standardized error responses.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  wqi?: any;
  stats?: any;
  count?: number;
  message?: string;
  error?: {
    code: string;
    message: string;
  } | string;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1000;

export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    headers = {},
    ...fetchOptions
  } = options;

  let attempt = 0;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      if (!navigator.onLine && !isLocalhost) {
        clearTimeout(timeoutId);
        return {
          success: false,
          error: {
            code: 'BROWSER_OFFLINE',
            message: 'You are currently offline. Please check your network connection.'
          }
        };
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Server returned 4xx or 5xx
        const errorMessage = typeof data === 'object' && data?.error 
          ? (typeof data.error === 'string' ? data.error : data.error.message || 'Request failed')
          : `HTTP ${response.status}: ${response.statusText}`;

        // Retry 5xx server errors if attempts remain
        if (response.status >= 500 && attempt < maxRetries) {
          attempt++;
          const waitTime = retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMessage
          }
        };
      }

      // If body is structured as { success: true, ... }
      if (typeof data === 'object' && data !== null) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data: data as T
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === 'AbortError';
      const isNetworkError = err.message?.includes('Failed to fetch') || err.name === 'TypeError';

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        attempt++;
        const waitTime = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      return {
        success: false,
        error: {
          code: isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          message: isTimeout
            ? 'Request timed out. Please try again.'
            : 'Unable to connect to the backend server. Please verify the server is running.'
        }
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: 'Failed to complete request after multiple attempts.'
    }
  };
}

export const httpClient = {
  get: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { method: 'GET', ...options }),

  post: <T = any>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    }),

  put: <T = any>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    }),

  delete: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { method: 'DELETE', ...options })
};
