import { ApiClient, RequestOptions } from './client';
import { ApiRoutes } from './routes';

export type OfferIdentifier = string | number;

export interface Offer {
  id: OfferIdentifier;
  name: string;
  description?: string;
  price?: number;
  persons?: number;
  quantity?: number;
  [key: string]: unknown;
}

export interface OfferInput {
  name: string;
  description?: string;
  price?: number;
  persons?: number;
  quantity?: number;
  [key: string]: unknown;
}

export class OfferApi extends ApiClient {
  async list(options: RequestOptions = {}): Promise<Offer[]> {
    return this.request<Offer[]>(ApiRoutes.OFFERS, {
      ...options,
      method: 'GET',
    });
  }

  async create(payload: OfferInput, options: RequestOptions = {}): Promise<Offer> {
    return this.request<Offer>(ApiRoutes.OFFERS, {
      ...options,
      method: 'POST',
      body: payload,
    });
  }

  async get(id: OfferIdentifier, options: RequestOptions = {}): Promise<Offer> {
    return this.request<Offer>(ApiRoutes.offerById(id), {
      ...options,
      method: 'GET',
    });
  }

  async update(
    id: OfferIdentifier,
    payload: OfferInput,
    options: RequestOptions = {},
  ): Promise<Offer> {
    return this.request<Offer>(ApiRoutes.offerById(id), {
      ...options,
      method: 'PUT',
      body: payload,
    });
  }

  async delete(id: OfferIdentifier, options: RequestOptions = {}): Promise<void> {
    await this.request<void>(ApiRoutes.offerById(id), {
      ...options,
      method: 'DELETE',
    });
  }
}
