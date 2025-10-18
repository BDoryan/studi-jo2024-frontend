import { ApiClient, RequestOptions } from './client';
import { JsonRecord } from './auth';
import { ApiRoutes } from './routes';

export interface CustomerProfile extends JsonRecord {
  id?: string | number;
  email?: string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket extends JsonRecord {
  id: string;
  reference?: string;
  eventName?: string;
  sessionDate?: string;
  venue?: string;
  seat?: string;
  category?: string;
  quantity?: number;
  status?: string;
}

export interface CustomerRequestOptions extends Omit<RequestOptions, 'body' | 'method'> {
  path?: string;
}

export class CustomerApi extends ApiClient {
  async getProfile(options: CustomerRequestOptions = {}): Promise<CustomerProfile> {
    const path = options.path ?? ApiRoutes.CUSTOMERS_ME;

    return this.request<CustomerProfile>(path, {
      ...options,
      method: 'GET',
    });
  }

  async getTickets(options: CustomerRequestOptions = {}): Promise<Ticket[]> {
      return [];
    // const path = options.path ?? ApiRoutes.CUSTOMERS_ME_TICKETS;
    //
    // return this.request<Ticket[]>(path, {
    //   ...options,
    //   method: 'GET',
    // });
  }
}
