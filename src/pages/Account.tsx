import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { CustomerApi, CustomerProfile, HttpError, Ticket } from '@/lib/api';

const GENERIC_ERROR_MESSAGE =
    'Impossible de récupérer vos informations pour le moment. Veuillez réessayer plus tard.';

const formatTicketDate = (value?: string): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    try {
        return new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(date);
    } catch {
        return date.toLocaleString();
    }
};

const selectValue = (...candidates: Array<string | undefined | null>): string => {
    for (const candidate of candidates) {
        if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }

    return '';
};

const Account: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user: sessionUser } = useAuth();
    const accountApi = useMemo(() => new CustomerApi(), []);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            if (!isActive) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [nextProfile, nextTickets] = await Promise.all([
                    accountApi.getProfile(),
                    accountApi.getTickets(),
                ]);

                if (!isActive) {
                    return;
                }

                setProfile(nextProfile);
                setTickets(Array.isArray(nextTickets) ? nextTickets : []);
            } catch (cause) {
                if (!isActive) {
                    return;
                }

                let message = GENERIC_ERROR_MESSAGE;

                if (cause instanceof HttpError && cause.message && cause.message.trim().length > 0) {
                    message = cause.message;
                } else if (cause instanceof Error && cause.message.trim().length > 0) {
                    message = cause.message;
                }

                setError(message);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isActive = false;
        };
    }, [accountApi]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
    }, [logout, navigate]);

    const handleViewOffers = useCallback(() => {
        navigate('/offers');
    }, [navigate]);

    const resolvedFirstName = useMemo(
        () =>
            selectValue(
                sessionUser?.firstName,
                profile?.firstname,
                profile?.first_name,
            ),
        [profile, sessionUser],
    );

    const resolvedLastName = useMemo(
        () =>
            selectValue(
                sessionUser?.lastName,
                profile?.lastname,
                profile?.last_name,
            ),
        [profile, sessionUser],
    );

    const resolvedEmail = useMemo(
        () =>
            selectValue(
                sessionUser?.email,
                profile?.email,
            ),
        [profile, sessionUser],
    );

    const displayFullName = selectValue(
        sessionUser?.fullName,
        `${resolvedFirstName} ${resolvedLastName}`.trim(),
        resolvedEmail,
        'Client Jeux Olympiques',
    );

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Header />
            <main className="flex flex-1 justify-center px-4 py-16 sm:px-8 lg:px-16">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Title level={1} className="text-primary-500">
                                Mon compte
                            </Title>
                            <p className="text-sm text-gray-600 sm:text-base">
                                Heureux de vous retrouver, {displayFullName}. Retrouvez vos informations et vos billets
                                en un clin d&apos;oeil.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
                            {loading ? (
                                <p className="mt-6 text-sm text-gray-500">Chargement de vos informations...</p>
                            ) : (
                                <dl className="mt-6 space-y-4 text-sm text-gray-700">
                                    <div>
                                        <dt className="font-semibold text-gray-800">Prénom</dt>
                                        <dd>{resolvedFirstName || 'Non communiqué'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold text-gray-800">Nom</dt>
                                        <dd>{resolvedLastName || 'Non communiqué'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold text-gray-800">Adresse e-mail</dt>
                                        <dd>{resolvedEmail || 'Non communiquée'}</dd>
                                    </div>
                                </dl>
                            )}
                            <div className="mt-5">
                                <Button type="button" variant="danger" onClick={handleLogout} className={"w-full"}>
                                    Se déconnecter
                                </Button>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
                            <h2 className="text-lg font-semibold text-gray-900">Réserver des billets</h2>
                            <p className="mt-3 text-sm text-gray-600">
                                Envie de vivre d&apos;autres émotions ? Consultez les offres disponibles et réservez vos
                                prochaines places.
                            </p>
                            <Button
                                type="button"
                                variant="primary"
                                className="mt-6 w-full sm:w-auto"
                                onClick={handleViewOffers}
                            >
                                Voir les offres
                            </Button>
                        </section>
                    </div>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Mes billets</h2>
                            {!loading && tickets.length > 0 && (
                                <span className="text-sm font-medium text-primary-600">
                                    {tickets.length} {tickets.length > 1 ? 'billets' : 'billet'}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <p className="mt-6 text-sm text-gray-500">Chargement de vos billets...</p>
                        ) : tickets.length === 0 ? (
                            <p className="mt-6 text-sm text-gray-600">
                                Vous n&apos;avez pas encore de billets. Utilisez le bouton « Voir les offres » pour
                                découvrir les prochaines disponibilités.
                            </p>
                        ) : (
                            <ul className="mt-6 space-y-4">
                                {tickets.map((ticket) => {
                                    const formattedDate = formatTicketDate(ticket.sessionDate);
                                    const title =
                                        ticket.eventName && ticket.eventName.trim().length > 0
                                            ? ticket.eventName
                                            : `Billet ${ticket.reference ?? ticket.id}`;

                                    return (
                                        <li
                                            key={ticket.id}
                                            className="rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm"
                                        >
                                            <p className="text-base font-semibold text-gray-900">{title}</p>
                                            <div className="mt-3 space-y-1 text-sm text-gray-600">
                                                {formattedDate && (
                                                    <p>
                                                        <span className="font-semibold text-gray-700">Date :</span>{' '}
                                                        {formattedDate}
                                                    </p>
                                                )}
                                                {ticket.venue && (
                                                    <p>
                                                        <span className="font-semibold text-gray-700">Lieu :</span>{' '}
                                                        {ticket.venue}
                                                    </p>
                                                )}
                                                {ticket.category && (
                                                    <p>
                                                        <span className="font-semibold text-gray-700">Catégorie :</span>{' '}
                                                        {ticket.category}
                                                    </p>
                                                )}
                                                {typeof ticket.quantity === 'number' && (
                                                    <p>
                                                        <span className="font-semibold text-gray-700">Billets :</span>{' '}
                                                        {ticket.quantity}
                                                    </p>
                                                )}
                                                {ticket.status && (
                                                    <p>
                                                        <span className="font-semibold text-gray-700">Statut :</span>{' '}
                                                        {ticket.status}
                                                    </p>
                                                )}
                                                {ticket.reference && (
                                                    <p className="text-xs text-gray-500">
                                                        Référence : {ticket.reference}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Account;
