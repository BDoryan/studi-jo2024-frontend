import React, {useCallback, useMemo, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import Header from "@/components/Header";
import Title from "@/components/Title";
import {Button} from "@/components/Button";
import {
    AuthApi,
    HttpError,
    RegisterPayload,
    RegisterResponse,
} from "@/lib/api";
import {translate, translateError, translateMessage} from "@/lib/i18n";
import { useAuth } from '@/lib/auth';
import Layout from "@/components/Layout";

type RegisterFormState = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirm_password: string;
    rgpdConsent: boolean;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormState, string>>;

interface FormStatus {
    loading: boolean;
    success: string | null;
    error: string | null;
}

const initialForm: RegisterFormState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm_password: '',
    rgpdConsent: false,
};

const initialStatus: FormStatus = {
    loading: false,
    success: null,
    error: null,
};

const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.';

const buildRegisterPayload = (form: RegisterFormState): RegisterPayload => ({
    email: form.email.trim(),
    password: form.password,
    confirm_password: form.confirm_password,
    firstname: form.firstName.trim(),
    lastname: form.lastName.trim(),
});

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

const Register: React.FC = () => {
    const authApi = useMemo(() => new AuthApi(), []);
    const { isAuthenticated } = useAuth();

    const [form, setForm] = useState<RegisterFormState>(initialForm);
    const [status, setStatus] = useState<FormStatus>(initialStatus);
    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const fieldLabels = useMemo<Record<keyof RegisterFormState, string>>(
        () => ({
            firstName: 'Prénom',
            lastName: 'Nom',
            email: 'Adresse e-mail',
            password: 'Mot de passe',
            confirm_password: 'Confirmation du mot de passe',
            rgpdConsent: 'Consentement RGPD',
        }),
        [],
    );

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, type, value, checked} = event.target;
        const fieldName = name as keyof RegisterFormState;
        const nextValue = type === 'checkbox' ? checked : value;

        setForm((prev) => ({
            ...prev,
            [fieldName]: nextValue as RegisterFormState[typeof fieldName],
        }));

        setErrors((prev) => {
            if (!prev[fieldName]) {
                return prev;
            }

            const next = {...prev};
            delete next[fieldName];
            return next;
        });
    }, []);

    const resolveErrorMessages = useCallback(
        (cause: unknown): {general: string; fieldErrors: RegisterFormErrors} => {
            const fallback = 'Inscription impossible.';
            const fieldErrors: RegisterFormErrors = {};

            const normaliseFieldName = (field?: string): keyof RegisterFormState | undefined => {
                if (!field) {
                    return undefined;
                }

                const normalised = field.toLowerCase();

                if (normalised.includes('first')) {
                    return 'firstName';
                }

                if (normalised.includes('last')) {
                    return 'lastName';
                }

                if (normalised.includes('mail')) {
                    return 'email';
                }

                if (normalised === 'password' || (normalised.includes('pass') && !normalised.includes('confirm'))) {
                    return 'password';
                }

                if (normalised.includes('confirm')) {
                    return 'confirm_password';
                }

                if (normalised.includes('consent') || normalised.includes('rgpd') || normalised.includes('gdpr')) {
                    return 'rgpdConsent';
                }

                return undefined;
            };

            const formatMessage = (
                code: string,
                params: Record<string, unknown>,
                fieldKey?: keyof RegisterFormState,
            ): string => {
                const label = fieldKey ? fieldLabels[fieldKey] : undefined;
                const enriched = {
                    ...params,
                    field: label
                        ? `Le champ "${label}"`
                        : typeof params.field === 'string'
                            ? String(params.field)
                            : 'Ce champ',
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

                    return {general: general || fallback, fieldErrors};
                }

                return {general: formatMessage(cause.message ?? '', {}) ?? fallback, fieldErrors};
            }

            if (cause instanceof Error) {
                return {general: formatMessage(cause.message ?? '', {}) ?? fallback, fieldErrors};
            }

            return {general: formatMessage(fallback, {}) ?? fallback, fieldErrors};
        },
        [fieldLabels],
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!form.rgpdConsent) {
                const consentMessage = 'Vous devez accepter le traitement de vos données personnelles.';
                setErrors((prev) => ({
                    ...prev,
                    rgpdConsent: consentMessage,
                }));
                setStatus({
                    loading: false,
                    success: null,
                    error: consentMessage,
                });
                return;
            }

            if (form.password !== form.confirm_password) {
                const message = 'Les mots de passe ne correspondent pas.';
                setErrors((prev) => ({
                    ...prev,
                    password: message,
                    confirm_password: message,
                }));
                setStatus({
                    loading: false,
                    success: null,
                    error: message,
                });
                return;
            }

            setStatus({loading: true, success: null, error: null});
            setErrors({});

            try {
                const payload = buildRegisterPayload(form);
                const response: RegisterResponse = await authApi.register(payload);
                setForm(initialForm);
                setErrors({});
                const translatedMessage = response.message
                    ? translateMessage(response.message) ?? translate(response.message)
                    : undefined;
                const successMessage = response.message
                    ? translatedMessage && translatedMessage !== 'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
                        ? translatedMessage
                        : response.message
                    : 'Compte créé avec succès.';
                setStatus({
                    loading: false,
                    success: successMessage,
                    error: null,
                });
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
        [authApi, form, resolveErrorMessages],
    );

    const heroImageUrl = "/imgs/sports/natation.jpeg";

    if (isAuthenticated) {
        return <Navigate to="/account" replace />;
    }

    return (
        <Layout className="flex min-h-screen flex-col bg-gray-50">
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
                        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:max-w-xl lg:max-w-2xl lg:p-10">
                            <div className="text-center">
                                <Title level={1} className="text-center text-primary-500">
                                    Créer un compte
                                </Title>
                                <p className="mt-3 text-center text-base text-gray-600">
                                    Rejoignez l’aventure et gérez vos billets pour les Jeux Olympiques 2024 en quelques
                                    clics.
                                </p>
                            </div>
                            <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit}>
                                {renderAlert(status)}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-left">
                                        <span className="text-sm font-semibold uppercase text-gray-600">
                                            Prénom{' '}
                                            <span className="text-red-600">*</span>
                                        </span>
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            autoComplete="given-name"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                                errors.firstName
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                            }`}
                                            placeholder="Alex"
                                            aria-invalid={Boolean(errors.firstName)}
                                            aria-describedby={errors.firstName ? 'register-firstName-error' : undefined}
                                        />
                                        {errors.firstName && (
                                            <p id="register-firstName-error" className="text-sm text-red-600 leading-4">
                                                {errors.firstName}
                                            </p>
                                        )}
                                    </label>
                                    <label className="flex flex-col gap-2 text-left">
                                        <span className="text-sm font-semibold uppercase text-gray-600">
                                            Nom{' '}
                                            <span className="text-red-600">*</span>
                                        </span>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            autoComplete="family-name"
                                            value={form.lastName}
                                            onChange={handleChange}
                                            className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                                errors.lastName
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                            }`}
                                            placeholder="Dupont"
                                            aria-invalid={Boolean(errors.lastName)}
                                            aria-describedby={errors.lastName ? 'register-lastName-error' : undefined}
                                        />
                                        {errors.lastName && (
                                            <p id="register-lastName-error" className="text-sm text-red-600 leading-4">
                                                {errors.lastName}
                                            </p>
                                        )}
                                    </label>
                                </div>
                                <label className="flex flex-col gap-2 text-left">
                                    <span className="text-sm font-semibold uppercase text-gray-600">
                                        Adresse e-mail{' '}
                                        <span className="text-red-600">*</span>
                                    </span>
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
                                        aria-describedby={errors.email ? 'register-email-error' : undefined}
                                    />
                                    {errors.email && (
                                        <p id="register-email-error" className="text-sm text-red-600 leading-4">
                                            {errors.email}
                                        </p>
                                    )}
                                </label>
                                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-left">
                                        <span className="text-sm font-semibold uppercase text-gray-600">
                                            Mot de passe{' '}
                                            <span className="text-red-600">*</span>
                                        </span>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="new-password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                                errors.password
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                            }`}
                                            placeholder="********"
                                            aria-invalid={Boolean(errors.password)}
                                            aria-describedby={errors.password ? 'register-password-error' : undefined}
                                        />
                                        {errors.password && (
                                            <p id="register-password-error" className="text-sm text-red-600 leading-4">
                                                {errors.password}
                                            </p>
                                        )}
                                    </label>
                                    <label className="flex flex-col gap-2 text-left">
                                        <span className="text-sm font-semibold uppercase text-gray-600">
                                            Confirmation du mot de passe{' '}
                                            <span className="text-red-600">*</span>
                                        </span>
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            required
                                            autoComplete="new-password"
                                            value={form.confirm_password}
                                            onChange={handleChange}
                                            className={`rounded-xl border px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                                                errors.confirm_password
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'
                                            }`}
                                            placeholder="********"
                                            aria-invalid={Boolean(errors.confirm_password)}
                                            aria-describedby={errors.confirm_password ? 'register-confirm_password-error' : undefined}
                                        />
                                        {errors.confirm_password && (
                                            <p id="register-confirm_password-error" className="text-sm text-red-600">
                                                {errors.confirm_password}
                                            </p>
                                        )}
                                    </label>
                                </div>
                                <label className="flex items-start gap-3 text-left">
                                    <input
                                        type="checkbox"
                                        name="rgpdConsent"
                                        checked={form.rgpdConsent}
                                        onChange={handleChange}
                                        className={`mt-1 h-5 w-5 rounded border ${
                                            errors.rgpdConsent
                                                ? 'border-red-400 text-red-500 focus:ring-red-200'
                                                : 'border-gray-300 text-primary-500 focus:ring-primary-300'
                                        } focus:outline-none`}
                                    />
                                    <span className="text-sm text-gray-700">
                                        J’accepte le traitement de mes données personnelles conformément à la politique
                                        de confidentialité.{' '}
                                        <span className="text-red-600">*</span>
                                    </span>
                                </label>
                                {errors.rgpdConsent && (
                                    <p className="-mt-4 pl-8 text-sm text-red-600">
                                        {errors.rgpdConsent}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="mt-2 w-full sm:w-auto"
                                    disabled={status.loading}
                                >
                                    {status.loading ? 'Création du compte...' : 'Créer mon compte'}
                                </Button>
                            </form>
                            <p className="mt-6 text-center text-sm text-gray-600 lg:text-left">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                                    Se connecter
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
        </Layout>
    );
};

export default Register;
