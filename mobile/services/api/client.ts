import type { ApiConfig } from './config';
import type { ApiErrorResponse } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: ApiErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  getConfig(): ApiConfig { return { ...this.config }; }
  setBaseUrl(url: string): void { this.config.baseUrl = url; }

  async get<T>(path: string, token?: string): Promise<T> {
    return this.request<T>(path, 'GET', undefined, token);
  }
  async post<T>(path: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(path, 'POST', body, token);
  }
  async put<T>(path: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(path, 'PUT', body, token);
  }
  async patch<T>(path: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(path, 'PATCH', body, token);
  }
  async delete<T>(path: string, token?: string): Promise<T> {
    return this.request<T>(path, 'DELETE', undefined, token);
  }
  async postFormData<T>(path: string, formData: FormData, token?: string): Promise<T> {
    return this.requestFormData<T>(path, 'POST', formData, token);
  }

  private buildUrl(path: string): string {
    const base = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async request<T>(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
    timeoutMs = 30000,
    _isRetry = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = this.buildUrl(path);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('Request timed out.', -2);
      }
      const isNetwork =
        err instanceof TypeError &&
        (err.message.includes('Network request failed') ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError'));
      const connErr = new ApiError(
        isNetwork
          ? 'Connection failed. Server unreachable or no internet.'
          : 'Connection failed. Check your internet connection.',
        -1,
      );
      if (isNetwork) connErr.name = 'ConnectionError';
      throw connErr;
    }

    // ── 401 auto-refresh ─────────────────────────────────────────────────────
    // Dynamic import avoids circular-dependency; only executed on actual 401.
    if (res.status === 401 && !_isRetry) {
      try {
        const { forceRefreshToken } = await import('../auth/holderAuth');
        const freshToken = await forceRefreshToken();
        if (freshToken) {
          return this.request<T>(path, method, body, freshToken, timeoutMs, true);
        }
      } catch {
        // Refresh failed — fall through and throw the original 401
      }
    }

    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    const payload: unknown = isJson ? await res.json() : { detail: await res.text() };

    if (!res.ok) {
      let msg = 'Request failed';
      if (payload && typeof payload === 'object') {
        const p = payload as Record<string, unknown>;
        msg = String(p.detail ?? p.message ?? p.error ?? msg);
      }
      throw new ApiError(msg, res.status, payload as ApiErrorResponse);
    }
    return payload as T;
  }

  private async requestFormData<T>(
    path: string,
    method: string,
    formData: FormData,
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = this.buildUrl(path);
    const res = await fetch(url, { method, headers, body: formData });
    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    const payload: unknown = isJson ? await res.json() : { detail: await res.text() };

    if (!res.ok) {
      let msg = 'Request failed';
      if (payload && typeof payload === 'object') {
        const p = payload as Record<string, unknown>;
        msg = String(p.detail ?? p.message ?? p.error ?? msg);
      }
      throw new ApiError(msg, res.status, payload as ApiErrorResponse);
    }
    return payload as T;
  }
}
