export class ApiRoutes {
  static readonly AUTH_CUSTOMER_LOGIN = '/auth/customer/login';
  static readonly AUTH_CUSTOMER_REGISTER = '/auth/customer/register';
  static readonly CUSTOMERS_ME = '/auth/customer/me';
  static readonly CUSTOMERS_ME_TICKETS = '/customers/me/tickets';

  static list(): string[] {
    return [
      ApiRoutes.AUTH_CUSTOMER_LOGIN,
      ApiRoutes.AUTH_CUSTOMER_REGISTER,
      ApiRoutes.CUSTOMERS_ME,
      ApiRoutes.CUSTOMERS_ME_TICKETS,
    ];
  }
}
