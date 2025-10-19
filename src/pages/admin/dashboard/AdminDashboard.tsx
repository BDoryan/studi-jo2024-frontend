import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import { AdminApi, AdminIdentifier, AdminOffer, AdminOfferInput, HttpError } from '@/lib/api';
import { useAdminAuth } from '@/lib/admin';
import { translateError, translateMessage } from '@/lib/i18n';
import { ADMIN_TICKET_SCANNER_PATH } from '@/pages/admin/constants';
import OfferForm from './OfferForm';
import OfferList from './OfferList';

const ensureNumber = (value: string, options: { allowFloat?: boolean } = {}): number | undefined => {
    if (!value) return undefined;
    const normalized = value.replace(',', '.');
    const parsed = options.allowFloat ? parseFloat(normalized) : parseInt(normalized, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const resolveApiError = (cause: unknown, fallback: string): string => {
    if (cause instanceof HttpError) {
        const details = cause.details;
        if (details && typeof details === 'object') {
            const data = details as Record<string, unknown>;
            const msg = typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : undefined;
            if (msg) return msg;
        }
        if (cause.message?.trim()) return cause.message;
    }
    if (cause instanceof Error && cause.message) return cause.message;
    return fallback;
};

const sortOffers = (entries: AdminOffer[]): AdminOffer[] =>
    [...entries].sort((a, b) => Number(b.id) - Number(a.id));

export type OfferFormState = {
    name: string;
    description: string;
    price: string;
    persons: string;
    quantity: string;
};

const initialForm: OfferFormState = {
    name: '',
    description: '',
    price: '',
    persons: '',
    quantity: '',
};

const AdminDashboard: React.FC = () => {
    const { user, logout, token } = useAdminAuth();
    const adminApi = useMemo(() => new AdminApi(() => token), [token]);
    const navigate = useNavigate();

    const [offers, setOffers] = useState<AdminOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [formState, setFormState] = useState<OfferFormState>(initialForm);
    const [activeOfferId, setActiveOfferId] = useState<AdminIdentifier | null>(null);

    const refreshOffers = useCallback(async () => {
        setListError(null);
        setIsLoading(true);
        try {
            const data = await adminApi.listOffers();
            setOffers(sortOffers(Array.isArray(data) ? data : []));
        } catch (e) {
            setListError(resolveApiError(e, 'Impossible de charger les offres.'));
        } finally {
            setIsLoading(false);
        }
    }, [adminApi]);

    const handleDeleteOffer = useCallback(
        async (offer: AdminOffer) => {
            try {
                await adminApi.deleteOffer(offer.id);
                await refreshOffers();
            } catch (e) {
                setListError(resolveApiError(e, "Impossible de supprimer l'offre."));
            }
        },
        [adminApi, refreshOffers]
    );

    useEffect(() => {
        void refreshOffers();
    }, [refreshOffers]);

    return (
        <div className="min-h-screen px-6 py-10 bg-gray-50 text-gray-900">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                {/* HEADER */}
                <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">
                            {translateMessage('admin_dashboard_title') ?? 'Tableau de bord'}
                        </p>
                        <h1 className="text-2xl font-semibold text-primary-600">
                            Bonjour{user?.full_name ? ` ${user.full_name}` : ''}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {translateMessage('admin_dashboard_subtitle') ??
                                'Gérez les offres disponibles pour les Jeux Olympiques 2024.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-gray-700">{user?.full_name ?? 'Administrateur'}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-500">{user?.email}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => navigate(ADMIN_TICKET_SCANNER_PATH)}>
                            Scanner les billets
                        </Button>
                        <Button variant="danger" size="sm" onClick={logout}>
                            Se déconnecter
                        </Button>
                    </div>
                </Card>

                {/* FORMULAIRE + LISTE */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                    <OfferForm
                        adminApi={adminApi}
                        activeOfferId={activeOfferId}
                        setActiveOfferId={setActiveOfferId}
                        offers={offers}
                        setOffers={setOffers}
                        formState={formState}
                        setFormState={setFormState}
                        initialForm={initialForm}
                    />
                    <OfferList
                        offers={offers}
                        isLoading={isLoading}
                        listError={listError}
                        onEdit={(offer) => {
                            setActiveOfferId(offer.id);
                            setFormState({
                                name: offer.name ?? '',
                                description: offer.description ?? '',
                                price: String(offer.price ?? ''),
                                persons: String(offer.persons ?? ''),
                                quantity: String(offer.quantity ?? ''),
                            });
                        }}
                        onDelete={handleDeleteOffer}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
