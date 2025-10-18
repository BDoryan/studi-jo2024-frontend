import React, {useCallback, useMemo, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import Header from "@/components/Header";
import Title from "@/components/Title";
import {Button} from "@/components/Button";
import {
    AuthApi,
    HttpError,
    LoginPayload,
    LoginResponse,
} from "@/lib/api";
import {translate, translateError} from "@/lib/i18n";
import { useAuth } from '@/lib/auth';

type LoginFormState = {
    email: string;
    password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormState, string>>;

interface FormStatus {
    loading: boolean;
    success: string | null;
    error: string | null;
}

const initialForm: LoginFormState = {
    email: '',
    password: '',
};

const initialStatus: FormStatus = {
    loading: false,
    success: null,
    error: null,
};

const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.';

const extractTokenFromResponse = (response: LoginResponse): string => {
    const token = response?.token;

    if (!token || token.trim().length === 0) {
        throw new Error("La réponse de l'API ne contient pas de jeton d'authentification.");
    }

    return token;
};

const renderAlert = (status: FormStatus) => {
    if (status.error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {status.error}
            </div>
        );
    }

    if (status.success) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status.success}
            </div>
        );
    }

    return null;
};

const Login: React.FC = () => {
    const authApi = useMemo(() => new AuthApi(), []);
    const { login: applyAuthToken, isAuthenticated } = useAuth();

    const [form, setForm] = useState<LoginFormState>(initialForm);
    const [status, setStatus] = useState<FormStatus>(initialStatus);
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const fieldLabels = useMemo<Record<keyof LoginFormState, string>>(
        () => ({
            email: 'Adresse e-mail',
            password: 'Mot de passe',
        }),
        [],
    );

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const {name, value} = event.target;
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
            const fieldName = name as keyof LoginFormState;
            setErrors((prev) => {
                if (!prev[fieldName]) {
                    return prev;
                }

                const next = {...prev};
                delete next[fieldName];
                return next;
            });
        },
        [],
    );

    const resolveErrorMessages = useCallback(
        (cause: unknown): {general: string; fieldErrors: LoginFormErrors} => {
            const fallback = 'Connexion impossible.';
            const fieldErrors: LoginFormErrors = {};

            const normaliseFieldName = (field?: string): keyof LoginFormState | undefined => {
                if (!field) {
                    return undefined;
                }

                const normalised = field.toLowerCase();

                if (normalised.includes('mail')) {
                    return 'email';
                }

                if (normalised.includes('pass')) {
                    return 'password';
                }

                return undefined;
            };

            const formatMessage = (
                code: string,
                params: Record<string, unknown>,
                fieldKey?: keyof LoginFormState,
            ): string => {
                const label = fieldKey ? fieldLabels[fieldKey] : undefined;
                const displayField = label
                    ? `Le champ « ${label} »`
                    : typeof params.field === 'string'
                        ? String(params.field)
                        : 'Ce champ';
                const enriched = {
                    ...params,
                    field: displayField,
                };
                const translated = translateError(code, enriched) ?? translate(code, enriched);

                if (translated) {
                    return translated;
                }

                return code && code.trim().length > 0 ? code : GENERIC_ERROR_MESSAGE;
            };

            if (cause instanceof HttpError) {
                const details = cause.details;

                if (details && typeof details === 'object') {
                    const data = details as Record<string, unknown>;
                    const topLevelCode =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.code === 'string'
                                ? data.code
                                : undefined;

                    let general = formatMessage(topLevelCode ?? '', data) ?? cause.message ?? fallback;

                    const registerFieldError = (
                        rawField: string | undefined,
                        entryCode: string | undefined,
                        params: Record<string, unknown> = {},
                    ) => {
                        if (!entryCode) {
                            return;
                        }

                        const fieldKey = normaliseFieldName(rawField);

                        if (fieldKey && fieldKey in fieldLabels) {
                            fieldErrors[fieldKey] = formatMessage(entryCode, params, fieldKey);
                            return;
                        }

                        if (!general || general === fallback) {
                            general = formatMessage(entryCode, params);
                        }
                    };

                    const {errors: rawErrors} = data;

                    if (Array.isArray(rawErrors)) {
                        for (const entry of rawErrors) {
                            if (!entry || typeof entry !== 'object') {
                                continue;
                            }

                            const errorEntry = entry as Record<string, unknown>;
                            const entryCode = typeof errorEntry.code === 'string' ? errorEntry.code : undefined;
                            const rawField =
                                typeof errorEntry.field === 'string'
                                    ? errorEntry.field
                                    : typeof errorEntry.attribute === 'string'
                                        ? errorEntry.attribute
                                        : typeof errorEntry.path === 'string'
                                            ? errorEntry.path
                                            : undefined;

                            const params =
                                errorEntry.meta && typeof errorEntry.meta === 'object'
                                    ? (errorEntry.meta as Record<string, unknown>)
                                    : errorEntry;

                            registerFieldError(rawField, entryCode, params);
                        }
                    } else if (rawErrors && typeof rawErrors === 'object') {
                        Object.entries(rawErrors).forEach(([rawField, value]) => {
                            let entryCode: string | undefined;
                            let params: Record<string, unknown> = {};

                            if (typeof value === 'string') {
                                entryCode = value;
                            } else if (Array.isArray(value)) {
                                entryCode = value.find((item) => typeof item === 'string') as string | undefined;
                            } else if (value && typeof value === 'object') {
                                const valueRecord = value as Record<string, unknown>;
                                if (typeof valueRecord.code === 'string') {
                                    entryCode = valueRecord.code;
                                }
                                if (valueRecord.meta && typeof valueRecord.meta === 'object') {
                                    params = valueRecord.meta as Record<string, unknown>;
                                } else if (valueRecord.params && typeof valueRecord.params === 'object') {
                                    params = valueRecord.params as Record<string, unknown>;
                                }
                            }

                            registerFieldError(rawField, entryCode, params);
                        });
                    }

                    return {
                        general: general || fallback,
                        fieldErrors,
                    };
                }

                return {
                    general: formatMessage(cause.message ?? '', {}) ?? fallback,
                    fieldErrors,
                };
            }

            if (cause instanceof Error) {
                return {
                    general: formatMessage(cause.message ?? '', {}) ?? fallback,
                    fieldErrors,
                };
            }

            return {
                general: formatMessage(fallback, {}) ?? fallback,
                fieldErrors,
            };
        },
        [fieldLabels],
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setStatus({loading: true, success: null, error: null});
            setErrors({});

            try {
                const payload: LoginPayload = {
                    email: form.email.trim(),
                    password: form.password,
                };

                const response = await authApi.login(payload);
                const token = extractTokenFromResponse(response);

                await applyAuthToken(token);
                setForm(initialForm);
                setErrors({});
                setStatus({loading: false, success: 'Connexion réussie.', error: null});
            } catch (error) {
                const {general, fieldErrors} = resolveErrorMessages(error);
                setErrors(fieldErrors);
                setStatus({
                    loading: false,
                    success: null,
                    error: general,
                });
            }
        },
        [applyAuthToken, authApi, form, resolveErrorMessages],
    );

    const heroImageUrl = "/imgs/display.jpeg";

    if (isAuthenticated) {
        return <Navigate to="/account" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Header/>
            <main className="flex flex-1">
                <div className="flex w-full flex-col lg:grid lg:min-h-full lg:grid-cols-2">
                    <section
                        aria-hidden
                        className="relative order-1 h-48 w-full overflow-hidden bg-primary-900/40 lg:hidden"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{backgroundImage: `url('${heroImageUrl}')`}}
                        />
                        <div className="absolute inset-0 bg-primary-900/50"/>
                    </section>
                    <section className="order-2 flex items-center justify-center px-4 py-12 sm:px-8 lg:order-1 lg:px-16">
                        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:max-w-lg lg:max-w-xl lg:p-10">
                            <Title level={1} className="text-center text-primary-500">
                                Connexion
                            </Title>
                            <p className="mt-3 text-center text-base text-gray-600">
                                Accédez à votre espace client pour retrouver vos billets et suivre vos commandes.
                            </p>
                            <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit}>
                                {renderAlert(status)}
                                <label className="flex flex-col gap-2 text-left">
                                    <span className="text-sm font-semibold uppercase text-gray-600">Adresse e-mail</span>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        autoComplete="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                            errors.email
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                        }`}
                                        placeholder="vous@example.com"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                                    />
                                    {errors.email && (
                                        <p id="login-email-error" className="text-sm text-red-600 leading-4">
                                            {errors.email}
                                        </p>
                                    )}
                                </label>
                                <label className="flex flex-col gap-2 text-left">
                                    <span className="text-sm font-semibold uppercase text-gray-600">Mot de passe</span>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                            errors.password
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                        }`}
                                        placeholder="********"
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={errors.password ? 'login-password-error' : undefined}
                                    />
                                    {errors.password && (
                                        <p id="login-password-error" className="text-sm text-red-600 leading-4">
                                            {errors.password}
                                        </p>
                                    )}
                                </label>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="mt-2 w-full sm:w-auto"
                                    disabled={status.loading}
                                >
                                    {status.loading ? 'Connexion en cours...' : 'Se connecter'}
                                </Button>
                            </form>
                            <p className="mt-6 text-center text-sm text-gray-600 lg:text-left">
                                Pas encore de compte ?{' '}
                                <Link to="/register" className="font-semibold text-primary-500 hover:text-primary-600">
                                    Créer un compte
                                </Link>
                            </p>
                        </div>
                    </section>
                    <section aria-hidden className="relative order-3 hidden h-full lg:block">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{backgroundImage: `url('${heroImageUrl}')`}}
                        />
                        <div className="absolute inset-0 bg-primary-900/40"/>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Login;
