import { getAuthToken } from './tokenStorage';

export interface ApiClientConfig {
  /**
   * Override the API host. Defaults to `import.meta.env.VITE_API_HOST`.
   */
  baseUrl?: string;
  /**
   * Headers that should be sent with every request.
   */
  defaultHeaders?: HeadersInit;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /**
   * JSON serialisable value or any Fetch-compatible body.
   */
  body?: unknown;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  details?: unknown;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'HttpError';
    this.status = payload.status;
    this.details = payload.details;
  }
}

const resolveApiBaseUrl = (overrides?: string): string => {
  const fromEnv = import.meta.env.VITE_API_HOST?.trim() ?? '';
  const candidate = overrides?.trim() ?? fromEnv;

  if (!candidate) {
    throw new Error(
      'API host is not configured. Provide `baseUrl` or define VITE_API_HOST in your environment.',
    );
  }

  return candidate.replace(/\/+$/, '');
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const isFetchBody = (value: unknown): value is BodyInit => {
  if (value == null) {
    return false;
  }

  if (typeof value === 'string' || value instanceof Blob || value instanceof FormData) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return true;
    }
  }

  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return true;
  }

  return false;
};

const ensureLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit | undefined;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = resolveApiBaseUrl(config.baseUrl);
    this.defaultHeaders = config.defaultHeaders;
  }

  async request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    const url = `${this.baseUrl}${ensureLeadingSlash(path)}`;
    const { body, headers, ...rest } = options;

    const preparedBody = this.prepareBody(body);
    const finalHeaders = this.buildHeaders(headers, preparedBody);

    const response = await fetch(url, {
      method: rest.method ?? (preparedBody ? 'POST' : 'GET'),
      ...rest,
      headers: finalHeaders,
      body: preparedBody,
    });

    const responseBody = await this.parseBody(response);

    if (!response.ok) {
      throw new HttpError({
        status: response.status,
        message:
          (responseBody && typeof responseBody === 'object' && 'message' in responseBody
            ? String((responseBody as Record<string, unknown>).message)
            : response.statusText || 'Unknown error'),
        details: responseBody,
      });
    }

    return responseBody as TResponse;
  }

  private prepareBody(body: unknown): BodyInit | undefined {
    if (body == null) {
      return undefined;
    }

    if (isFetchBody(body)) {
      return body;
    }

    if (Array.isArray(body) || isPlainObject(body)) {
      return JSON.stringify(body);
    }

    return String(body);
  }

  private buildHeaders(headers: HeadersInit | undefined, body: BodyInit | undefined): HeadersInit {
    const merged: Record<string, string> = {
      Accept: 'application/json',
    };

    const append = (init?: HeadersInit) => {
      if (!init) {
        return;
      }

      if (init instanceof Headers) {
        init.forEach((value, key) => {
          merged[key] = value;
        });
        return;
      }

      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          merged[key] = value;
        });
        return;
      }

      Object.entries(init).forEach(([key, value]) => {
        if (typeof value !== 'undefined') {
          merged[key] = String(value);
        }
      });
    };

    append(this.defaultHeaders);
    append(headers);

    const hasContentType = Object.keys(merged).some(
      (key) => key.toLowerCase() === 'content-type',
    );

    if (body && !hasContentType && typeof body === 'string') {
      merged['Content-Type'] = 'application/json';
    }

    const hasAuthorization = Object.keys(merged).some(
      (key) => key.toLowerCase() === 'authorization',
    );

    if (!hasAuthorization) {
      const token = getAuthToken();

      if (token) {
        merged.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
    }

    return merged;
  }

  private async parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type');

    if (!contentType) {
      return undefined;
    }

    if (contentType.includes('application/json')) {
      return response.json().catch(() => undefined);
    }

    if (contentType.startsWith('text/')) {
      return response.text().catch(() => undefined);
    }

    return response.arrayBuffer().catch(() => undefined);
  }
}
