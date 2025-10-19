import { ApiClient, ApiClientConfig, RequestOptions } from './client';
import { ApiRoutes } from './routes';

export type Identifier = number;

export interface AdminOffer {
    id: Identifier;
    name: string;
    description?: string;
    price?: number;
    persons?: number;
    quantity?: number;
    [key: string]: unknown;
}

export interface AdminOfferInput {
    name: string;
    description?: string;
    price?: number;
    persons?: number;
    quantity?: number;
    [key: string]: unknown;
}

// Nouveau type : données renvoyées par /auth/admin/me
export interface AdminProfile {
    email: string;
    full_name?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
}

export interface TicketScanRequest {
    ticket_secret: string;
}

export interface TicketValidateRequest {
    ticket_secret: string;
}

export interface TicketScanCustomer {
    id: Identifier;
    first_name?: string;
    last_name?: string;
    email?: string;
    [key: string]: unknown;
}

export interface TicketScanResponse {
    ticketId: Identifier;
    status: string;
    entries_allowed?: number;
    offer_name?: string;
    amount?: number;
    created_at?: string;
    customer?: TicketScanCustomer;
    [key: string]: unknown;
}

export interface ApiMessageResponse {
    status: string;
    message: string;
    [key: string]: unknown;
}

type HeadersRecord = Record<string, string>;

const normalizeHeaders = (input?: HeadersInit): HeadersRecord => {
    if (!input) {
        return {};
    }

    if (input instanceof Headers) {
        const record: HeadersRecord = {};
        input.forEach((value, key) => {
            record[key] = value;
        });
        return record;
    }

    if (Array.isArray(input)) {
        return input.reduce<HeadersRecord>((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    }

    return { ...(input as HeadersRecord) };
};

const ensureBearer = (token: string): string =>
    token.startsWith('Bearer ') ? token : `Bearer ${token}`;

export class AdminApi extends ApiClient {
    private readonly tokenProvider: () => string | null;

    constructor(tokenProvider: () => string | null, config: ApiClientConfig = {}) {
        super(config);
        this.tokenProvider = tokenProvider;
    }

    private withAuth(options: RequestOptions = {}): RequestOptions {
        const token = this.tokenProvider?.() ?? null;
        const headers = normalizeHeaders(options.headers);

        if (token) {
            headers.Authorization = ensureBearer(token);
        }

        return {
            ...options,
            headers,
        };
    }

    // --- Nouvelle méthode : vérification du token ---
    async getCurrentAdmin(options: RequestOptions = {}): Promise<AdminProfile> {
        return this.request<AdminProfile>(
            ApiRoutes.AUTH_ADMIN_ME, // route côté backend
            this.withAuth({
                ...options,
                method: 'GET',
            }),
        );
    }

    // --- Offres ---
    async listOffers(options: RequestOptions = {}): Promise<AdminOffer[]> {
        return this.request<AdminOffer[]>(
            ApiRoutes.OFFERS,
            this.withAuth({
                ...options,
                method: 'GET',
            }),
        );
    }

    async createOffer(payload: AdminOfferInput, options: RequestOptions = {}): Promise<AdminOffer> {
        return this.request<AdminOffer>(
            ApiRoutes.OFFERS,
            this.withAuth({
                ...options,
                method: 'POST',
                body: payload,
            }),
        );
    }

    async updateOffer(
        id: Identifier,
        payload: AdminOfferInput,
        options: RequestOptions = {},
    ): Promise<AdminOffer> {
        const path = ApiRoutes.offerById(id);

        return this.request<AdminOffer>(
            path,
            this.withAuth({
                ...options,
                method: options.method ?? 'PUT',
                body: payload,
            }),
        );
    }

    async deleteOffer(id: Identifier, options: RequestOptions = {}): Promise<void> {
        const path = ApiRoutes.offerById(id);

        await this.request<void>(
            path,
            this.withAuth({
                ...options,
                method: 'DELETE',
            }),
        );
    }

    async getOffer(id: Identifier, options: RequestOptions = {}): Promise<AdminOffer> {
        const path = ApiRoutes.offerById(id);

        return this.request<AdminOffer>(
            path,
            this.withAuth({
                ...options,
                method: 'GET',
            }),
        );
    }

    async scanTicket(
        payload: TicketScanRequest,
        options: RequestOptions = {},
    ): Promise<TicketScanResponse> {
        return this.request<TicketScanResponse>(
            ApiRoutes.TICKETS_SCAN,
            this.withAuth({
                ...options,
                method: 'POST',
                body: payload,
            }),
        );
    }

    async validateTicket(
        payload: TicketValidateRequest,
        options: RequestOptions = {},
    ): Promise<ApiMessageResponse> {
        return this.request<ApiMessageResponse>(
            ApiRoutes.TICKETS_VALIDATE,
            this.withAuth({
                ...options,
                method: 'POST',
                body: payload,
            }),
        );
    }
}
