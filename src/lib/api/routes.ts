export class ApiRoutes {
    static readonly AUTH_CUSTOMER_LOGIN = '/auth/customer/login';
    static readonly AUTH_CUSTOMER_LOGIN_VERIFY = '/auth/customer/login/verify';
    static readonly AUTH_CUSTOMER_REGISTER = '/auth/customer/register';
    static readonly CUSTOMERS_ME = '/auth/customer/me';
    static readonly CUSTOMERS_ME_TICKETS = '/auth/customer/me/tickets';
    static readonly AUTH_ADMIN_LOGIN = '/auth/admin/login';
    static readonly AUTH_ADMIN_LOGIN_VERIFY = '/auth/admin/login/verify';
    static readonly AUTH_ADMIN_ME = '/auth/admin/me';
    static readonly OFFERS = '/offers';
    static readonly PAYMENTS_CHECKOUT = '/payments/checkout';
    static readonly PAYMENTS_STATUS = '/payments/status';
    static readonly TICKETS_SCAN = '/tickets/scan';
    static readonly TICKETS_VALIDATE = '/tickets/validate';

    static list(): string[] {
        return [
            ApiRoutes.AUTH_CUSTOMER_LOGIN,
            ApiRoutes.AUTH_CUSTOMER_LOGIN_VERIFY,
            ApiRoutes.AUTH_CUSTOMER_REGISTER,
            ApiRoutes.CUSTOMERS_ME,
            ApiRoutes.CUSTOMERS_ME_TICKETS,
            ApiRoutes.AUTH_ADMIN_LOGIN,
            ApiRoutes.AUTH_ADMIN_LOGIN_VERIFY,
            ApiRoutes.AUTH_ADMIN_ME,
            ApiRoutes.PAYMENTS_CHECKOUT,
            ApiRoutes.OFFERS,
            ApiRoutes.PAYMENTS_STATUS,
            ApiRoutes.TICKETS_SCAN,
            ApiRoutes.TICKETS_VALIDATE,
        ];
    }

    static offerById(id: string | number): string {
        return `${ApiRoutes.OFFERS}/${id}`;
    }

    static paymentStatus(sessionId: string): string {
        return `${ApiRoutes.PAYMENTS_STATUS}/${encodeURIComponent(sessionId)}`;
    }
}
