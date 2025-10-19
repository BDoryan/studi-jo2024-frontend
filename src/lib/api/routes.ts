export class ApiRoutes {
    static readonly AUTH_CUSTOMER_LOGIN = '/auth/customer/login';
    static readonly AUTH_CUSTOMER_REGISTER = '/auth/customer/register';
    static readonly CUSTOMERS_ME = '/auth/customer/me';
    static readonly CUSTOMERS_ME_TICKETS = '/customers/me/tickets';
    static readonly AUTH_ADMIN_LOGIN = '/auth/admin/login';
    static readonly AUTH_ADMIN_ME = '/auth/admin/me';
    static readonly OFFERS = '/offers';

    static list(): string[] {
        return [
            ApiRoutes.AUTH_CUSTOMER_LOGIN,
            ApiRoutes.AUTH_CUSTOMER_REGISTER,
            ApiRoutes.CUSTOMERS_ME,
            ApiRoutes.CUSTOMERS_ME_TICKETS,
            ApiRoutes.AUTH_ADMIN_LOGIN,
            ApiRoutes.OFFERS,
        ];
    }

    static offerById(id: string | number): string {
        return `${ApiRoutes.OFFERS}/${id}`;
    }
}
