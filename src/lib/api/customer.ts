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
  ticketId?: number;
  ticket_id?: number;
  ticketSecret?: string;
  ticket_secret?: string;
  status?: string;
  entriesAllowed?: number;
  entries_allowed?: number;
  offerName?: string;
  offer_name?: string;
  amount?: number;
  transactionStatus?: string;
  transaction_status?: string;
  createdAt?: string;
  created_at?: string;
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
    const path = options.path ?? ApiRoutes.CUSTOMERS_ME_TICKETS;

    return this.request<Ticket[]>(path, {
      ...options,
      method: 'GET',
    });
  }
}
