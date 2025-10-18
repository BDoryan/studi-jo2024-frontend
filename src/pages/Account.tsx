import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import Card from '@/components/Card';
import { useAuth } from '@/lib/auth';
import { CustomerApi, CustomerProfile, HttpError, Ticket } from '@/lib/api';

const GENERIC_ERROR_MESSAGE =
    'Impossible de récupérer vos informations pour le moment. Veuillez réessayer plus tard.';

const pickFirstValue = (...values: Array<string | undefined | null>): string => {
    for (const value of values) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }

    return '';
};

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

const Account: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user: sessionUser } = useAuth();
    const accountApi = useMemo(() => new CustomerApi(), []);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [profileData, ticketsData] = await Promise.all([
                    accountApi.getProfile(),
                    accountApi.getTickets(),
                ]);

                if (!isMounted) {
                    return;
                }

                setProfile(profileData);
                setTickets(Array.isArray(ticketsData) ? ticketsData : []);
            } catch (cause) {
                if (!isMounted) {
                    return;
                }

                let message = GENERIC_ERROR_MESSAGE;

                if (cause instanceof HttpError && cause.message?.trim()) {
                    message = cause.message;
                } else if (cause instanceof Error && cause.message.trim()) {
                    message = cause.message;
                }

                setError(message);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [accountApi]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
    }, [logout, navigate]);

    const handleViewOffers = useCallback(() => {
        navigate('/offers');
    }, [navigate]);

    const identity = useMemo(() => {
        const firstName = pickFirstValue(
            sessionUser?.firstName,
            profile?.firstname,
            profile?.first_name,
        );
        const lastName = pickFirstValue(
            sessionUser?.lastName,
            profile?.lastname,
            profile?.last_name,
        );
        const email = pickFirstValue(sessionUser?.email, profile?.email);
        const fullName = pickFirstValue(
            sessionUser?.fullName,
            `${firstName} ${lastName}`.trim(),
            email,
            'Client Jeux Olympiques',
        );

        return { firstName, lastName, email, fullName };
    }, [profile, sessionUser]);

    const personalInfo = useMemo(
        () => [
            { label: 'Prénom', value: identity.firstName || 'Non communiqué' },
            { label: 'Nom', value: identity.lastName || 'Non communiqué' },
            { label: 'Adresse e-mail', value: identity.email || 'Non communiquée' },
        ],
        [identity],
    );

    const isLoadingTickets = loading;
    const hasTickets = !isLoadingTickets && tickets.length > 0;

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
                                Heureux de vous retrouver, {identity.fullName}. Retrouvez vos informations et vos billets
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
                        <Card as="section">
                            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
                            {loading ? (
                                <p className="mt-6 text-sm text-gray-500">Chargement de vos informations...</p>
                            ) : (
                                <dl className="mt-6 space-y-4 text-sm text-gray-700">
                                    {personalInfo.map((item) => (
                                        <div key={item.label}>
                                            <dt className="font-semibold text-gray-800">{item.label}</dt>
                                            <dd>{item.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                            <div className="mt-5">
                                <Button className={"w-full"} type="button" variant="danger" onClick={handleLogout}>
                                    Se déconnecter
                                </Button>
                            </div>
                        </Card>

                        <Card className={"flex justify-center items-center flex-col text-center"} as="section">
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
                        </Card>
                    </div>

                    <Card as="section">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Mes billets</h2>
                            {hasTickets && (
                                <span className="text-sm font-medium text-primary-600">
                                    {tickets.length} {tickets.length > 1 ? 'billets' : 'billet'}
                                </span>
                            )}
                        </div>

                        {isLoadingTickets ? (
                            <p className="mt-6 text-sm text-gray-500">Chargement de vos billets...</p>
                        ) : !hasTickets ? (
                            <p className="mt-6 text-sm text-gray-600">
                                Vous n&apos;avez pas encore de billets. Utilisez le bouton « Voir les offres » pour
                                découvrir les prochaines disponibilités.
                            </p>
                        ) : (
                            <ul className="mt-6 space-y-4">
                                {tickets.map((ticket) => {
                                    const details = [
                                        { label: 'Date', value: formatTicketDate(ticket.sessionDate) },
                                        { label: 'Lieu', value: ticket.venue },
                                        { label: 'Catégorie', value: ticket.category },
                                        {
                                            label: 'Billets',
                                            value:
                                                typeof ticket.quantity === 'number'
                                                    ? ticket.quantity.toString()
                                                    : null,
                                        },
                                        { label: 'Statut', value: ticket.status },
                                    ].filter(
                                        (detail) =>
                                            detail.value !== null &&
                                            String(detail.value).trim().length > 0,
                                    );

                                    const reference = ticket.reference ? `Référence : ${ticket.reference}` : null;
                                    const title =
                                        ticket.eventName?.trim().length
                                            ? ticket.eventName
                                            : `Billet ${ticket.reference ?? ticket.id}`;

                                    return (
                                        <Card as="li" key={ticket.id} variant="muted" padding="p-5">
                                            <p className="text-base font-semibold text-gray-900">{title}</p>
                                            <div className="mt-3 space-y-1 text-sm text-gray-600">
                                                {details.map((detail) => (
                                                    <p key={`${ticket.id}-${detail.label}`}>
                                                        <span className="font-semibold text-gray-700">
                                                            {detail.label} :
                                                        </span>{' '}
                                                        {detail.value}
                                                    </p>
                                                ))}
                                                {reference && <p className="text-xs text-gray-500">{reference}</p>}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Account;
