import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import { AuthApi, HttpError, LoginPayload, LoginResponse, ApiRoutes } from '@/lib/api';
import { useAdminAuth } from '@/lib/admin';
import { ADMIN_DASHBOARD_PATH } from '@/pages/admin/constants';
import { translate, translateError, translateMessage } from '@/lib/i18n';

const ensureToken = (response: LoginResponse): string => {
    const token = response?.token;
    if (!token || token.trim().length === 0) {
        throw new Error("Le jeton d'authentification est manquant dans la réponse.");
    }
    return token;
};

const resolveErrorMessage = (cause: unknown): string => {
    if (cause instanceof HttpError) {
        const details = cause.details;
        if (details && typeof details === 'object') {
            const data = details as Record<string, unknown>;
            const errorCode =
                typeof data.code === 'string'
                    ? data.code
                    : typeof data.message === 'string'
                        ? data.message
                        : undefined;
            const translated =
                translateError(errorCode) ?? translateMessage(errorCode ?? '') ?? undefined;
            if (translated) return translated;
            const explicit =
                typeof data.message === 'string'
                    ? data.message
                    : typeof data.error === 'string'
                        ? data.error
                        : undefined;
            if (explicit && explicit.trim().length > 0) {
                return explicit;
            }
        }
        if (cause.message && cause.message.trim().length > 0) {
            const translated = translateError(cause.message);
            if (translated) return translated;
            return cause.message;
        }
    }
    if (cause instanceof Error && cause.message) {
        return cause.message;
    }
    return translate('validation_failed');
};

type AdminLoginForm = Pick<LoginPayload, 'email' | 'password'>;
type AdminLoginErrors = Partial<Record<keyof AdminLoginForm, string>>;

const initialForm: AdminLoginForm = {
    email: '',
    password: '',
};

export const AdminLogin: React.FC = () => {
    const authApi = useMemo(() => new AuthApi(), []);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading } = useAdminAuth();
    const [form, setForm] = useState<AdminLoginForm>(initialForm);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AdminLoginErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const redirectTarget =
        (location.state as { from?: string } | null)?.from ?? ADMIN_DASHBOARD_PATH;

    const fieldLabels = useMemo<Record<keyof AdminLoginForm, string>>(
        () => ({
            email: translateMessage('admin_field_admin_email') ?? 'Adresse e-mail',
            password: translateMessage('admin_field_admin_password') ?? 'Mot de passe',
        }),
        [],
    );

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => {
            if (!prev[name as keyof AdminLoginForm]) return prev;
            const next = { ...prev };
            delete next[name as keyof AdminLoginForm];
            return next;
        });
    }, []);

    const validateForm = useCallback(
        (state: AdminLoginForm): AdminLoginErrors => {
            const nextErrors: AdminLoginErrors = {};
            if (!state.email.trim()) {
                nextErrors.email =
                    translateError('is_required', { field: fieldLabels.email }) ??
                    `${fieldLabels.email} est requis.`;
            } else {
                const mailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!mailPattern.test(state.email.trim())) {
                    nextErrors.email =
                        translateError('must_be_valid_email', { field: fieldLabels.email }) ??
                        `${fieldLabels.email} doit contenir une adresse e-mail valide.`;
                }
            }
            if (!state.password.trim()) {
                nextErrors.password =
                    translateError('is_required', { field: fieldLabels.password }) ??
                    `${fieldLabels.password} est requis.`;
            }
            return nextErrors;
        },
        [fieldLabels],
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setError(null);
            const validationErrors = validateForm(form);
            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors);
                return;
            }
            setFieldErrors({});
            setIsSubmitting(true);
            try {
                const response = await authApi.login(form, {
                    path: ApiRoutes.AUTH_ADMIN_LOGIN,
                });
                const token = ensureToken(response);
                const email =
                    typeof (response as Record<string, unknown>).email === 'string'
                        ? String((response as Record<string, unknown>).email)
                        : form.email;
                const full_name =
                    typeof (response as Record<string, unknown>).full_name === 'string'
                        ? String((response as Record<string, unknown>).full_name)
                        : undefined;
                await login({ token, email, full_name });
                navigate(redirectTarget, { replace: true });
            } catch (cause) {
                setError(resolveErrorMessage(cause));
            } finally {
                setIsSubmitting(false);
            }
        },
        [authApi, form, login, navigate, redirectTarget, validateForm],
    );

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="h-10 w-10 animate-spin text-primary-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        role="status"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                    <span className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Chargement de l’espace administrateur...
          </span>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={redirectTarget} replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-16">
            <Card className="w-full max-w-lg border-gray-200 bg-white text-gray-800 shadow-lg">
                <div className="mb-8 space-y-2 text-center">
                    <Title level={2} className="text-3xl font-semibold text-primary-600">
                        {translateMessage('admin_login_title') ?? 'Espace administrateur'}
                    </Title>
                    <p className="text-sm text-gray-600">
                        {translateMessage('admin_login_description') ??
                            'Connectez-vous pour accéder au tableau de bord et gérer les offres.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-2">
                        <label
                            htmlFor="admin-email"
                            className="text-xs font-semibold uppercase tracking-wide text-gray-700"
                        >
                            {fieldLabels.email}{' '}
                            <span className="text-red-600">*</span>
                        </label>
                        <input
                            id="admin-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            value={form.email}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200/60 disabled:cursor-not-allowed disabled:opacity-70 ${
                                fieldErrors.email
                                    ? 'border-red-400 bg-red-50 text-red-700 placeholder-red-300'
                                    : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400'
                            }`}
                            placeholder="admin@jo2024.fr"
                        />
                        {fieldErrors.email && (
                            <p className="text-xs text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="admin-password"
                            className="text-xs font-semibold uppercase tracking-wide text-gray-700"
                        >
                            {fieldLabels.password}{' '}
                            <span className="text-red-600">*</span>
                        </label>
                        <input
                            id="admin-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200/60 disabled:cursor-not-allowed disabled:opacity-70 ${
                                fieldErrors.password
                                    ? 'border-red-400 bg-red-50 text-red-700 placeholder-red-300'
                                    : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400'
                            }`}
                            placeholder="••••••••"
                        />
                        {fieldErrors.password && (
                            <p className="text-xs text-red-600">{fieldErrors.password}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default AdminLogin;
