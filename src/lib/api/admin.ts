import { ApiClient, ApiClientConfig, RequestOptions } from './client';
import { ApiRoutes } from './routes';

export type AdminIdentifier = string | number;

export interface AdminOffer {
    id: AdminIdentifier;
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
        id: AdminIdentifier,
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

    async deleteOffer(id: AdminIdentifier, options: RequestOptions = {}): Promise<void> {
        const path = ApiRoutes.offerById(id);

        await this.request<void>(
            path,
            this.withAuth({
                ...options,
                method: 'DELETE',
            }),
        );
    }

    async getOffer(id: AdminIdentifier, options: RequestOptions = {}): Promise<AdminOffer> {
        const path = ApiRoutes.offerById(id);

        return this.request<AdminOffer>(
            path,
            this.withAuth({
                ...options,
                method: 'GET',
            }),
        );
    }
}
