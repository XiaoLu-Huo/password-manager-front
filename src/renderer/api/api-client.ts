import { ApiResponse, ApiError, NetworkError, AuthExpiredError } from '../types/api';

export type LockHandler = () => void;

/**
 * Unified API client for all backend REST API calls.
 *
 * - Parses ApiResponse<T>: code=0 → return data, code≠0 → throw ApiError
 * - Intercepts 401 → clears session token, triggers lock callback
 * - Attaches session token to request headers automatically
 * - Wraps network failures as NetworkError
 */
export class ApiClient {
  private sessionToken: string | null = null;
  private onLock: LockHandler | null = null;
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  setSessionToken(token: string | null): void {
    this.sessionToken = token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  setOnLock(handler: LockHandler | null): void {
    this.onLock = handler;
  }

  /**
   * Core request method. All API calls go through here.
   */
  async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.sessionToken) {
      headers.set('Authorization', `Bearer ${this.sessionToken}`);
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (error) {
      // fetch throws TypeError on network failure (DNS, connection refused, etc.)
      throw new NetworkError('网络连接失败，请检查后端服务是否启动');
    }

    if (response.status === 401) {
      this.sessionToken = null;
      this.onLock?.();
      throw new AuthExpiredError('会话已过期，请重新解锁');
    }

    const result: ApiResponse<T> = await response.json();

    if (result.code !== 0) {
      throw new ApiError(result.code, result.message);
    }

    return result.data;
  }

  // ---- Convenience HTTP methods ----

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * POST with FormData (for file uploads). Skips Content-Type so the
   * browser sets the multipart boundary automatically.
   */
  postForm<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: formData });
  }
}

// Singleton instance used across the app
export const apiClient = new ApiClient();
