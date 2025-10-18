import { ApiClient, RequestOptions } from './client';
import { ApiRoutes } from './routes';

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export type LoginPayload = JsonRecord & {
  email: string;
  password: string;
};

export type RegisterPayload = JsonRecord & {
  email: string;
  password: string;
  confirm_password: string;
  firstname: string;
  lastname: string;
};

export interface LoginResponse extends JsonRecord {
  token: string;
}

export interface RegisterResponse extends JsonRecord {
  status?: string;
  message?: string;
}

export interface AuthRequestOptions extends Omit<RequestOptions, 'body' | 'method'> {
  /**
   * Provide a different relative path if your API deviates from the defaults.
   */
  path?: string;
}

export class AuthApi extends ApiClient {
  async login(
    payload: LoginPayload,
    options: AuthRequestOptions = {},
  ): Promise<LoginResponse> {
    const path = options.path ?? ApiRoutes.AUTH_CUSTOMER_LOGIN;

    return this.request<LoginResponse>(path, {
      ...options,
      method: 'POST',
      body: payload,
    });
  }

  async register(
    payload: RegisterPayload,
    options: AuthRequestOptions = {},
  ): Promise<RegisterResponse> {
    const path = options.path ?? ApiRoutes.AUTH_CUSTOMER_REGISTER;

    return this.request<RegisterResponse>(path, {
      ...options,
      method: 'POST',
      body: payload,
    });
  }
}
