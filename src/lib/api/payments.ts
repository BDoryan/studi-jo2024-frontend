import { ApiClient, RequestOptions } from './client';
import { ApiRoutes } from './routes';

export interface CheckoutPayload extends Record<string, unknown> {
  offer_id: number;
}

export interface CheckoutResponse extends Record<string, unknown> {
  checkout_url: string;
}

export interface PaymentStatusResponse extends Record<string, unknown> {
  status?: string;
}

export class PaymentsApi extends ApiClient {
  async checkout(payload: CheckoutPayload, options: RequestOptions = {}): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>(ApiRoutes.PAYMENTS_CHECKOUT, {
      ...options,
      method: 'POST',
      body: payload,
    });
  }

  async getStatus(sessionId: string, options: RequestOptions = {}): Promise<PaymentStatusResponse> {
    return this.request<PaymentStatusResponse>(ApiRoutes.paymentStatus(sessionId), {
      ...options,
      method: 'GET',
    });
  }
}
