import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import Card from '@/components/Card';
import { useAuth } from '@/lib/auth';
import { CustomerApi, CustomerProfile, HttpError, PaymentsApi, Ticket } from '@/lib/api';
import { loadJsPdf } from '@/lib/pdf/jspdfLoader';

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
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { logout, user: sessionUser } = useAuth();
    const accountApi = useMemo(() => new CustomerApi(), []);
    const paymentsApi = useMemo(() => new PaymentsApi(), []);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentStatusLoading, setIsPaymentStatusLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [paymentStatusError, setPaymentStatusError] = useState<string | null>(null);

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

    const paymentRoute = useMemo(() => {
        const normalizedPath = location.pathname.replace(/\/+$/, '');

        if (normalizedPath === '/account/success') {
            return 'success';
        }

        if (normalizedPath === '/account/cancel') {
            return 'cancel';
        }

        return null;
    }, [location.pathname]);

    const sessionId = useMemo(() => {
        const value = searchParams.get('session_id');
        return value && value.trim().length > 0 ? value.trim() : '';
    }, [searchParams]);

    useEffect(() => {
        let isActive = true;

        if (!paymentRoute) {
            setIsPaymentStatusLoading(false);
            setPaymentStatus(null);
            setPaymentStatusError(null);
            return () => {
                isActive = false;
            };
        }

        if (!sessionId) {
            setIsPaymentStatusLoading(false);
            setPaymentStatus(paymentRoute === 'cancel' ? 'CANCELLED' : null);
            setPaymentStatusError(
                paymentRoute === 'success'
                    ? "Identifiant de paiement introuvable. Veuillez reprendre votre commande depuis la billetterie."
                    : null,
            );

            return () => {
                isActive = false;
            };
        }

        const loadStatus = async () => {
            setIsPaymentStatusLoading(true);
            setPaymentStatus(null);
            setPaymentStatusError(null);

            try {
                const response = await paymentsApi.getStatus(sessionId);

                if (!isActive) {
                    return;
                }

                const rawStatus =
                    typeof response?.status === 'string'
                        ? response.status.trim().toUpperCase()
                        : '';

                setPaymentStatus(rawStatus || 'UNKNOWN');
            } catch (cause) {
                if (!isActive) {
                    return;
                }

                let message =
                    'Impossible de vérifier le statut de votre paiement pour le moment. Veuillez réessayer ultérieurement.';

                if (cause instanceof HttpError && cause.message?.trim()) {
                    message = cause.message;
                } else if (cause instanceof Error && cause.message.trim()) {
                    message = cause.message;
                }

                setPaymentStatusError(message);
            } finally {
                if (isActive) {
                    setIsPaymentStatusLoading(false);
                }
            }
        };

        void loadStatus();

        return () => {
            isActive = false;
        };
    }, [paymentRoute, sessionId, paymentsApi]);

    const paymentBanner = useMemo(() => {
        if (!paymentRoute) {
            return null;
        }

        const baseClasses = {
            success: 'border-green-200 bg-green-50 text-green-800',
            info: 'border-blue-200 bg-blue-50 text-blue-800',
            warning: 'border-amber-200 bg-amber-50 text-amber-900',
            error: 'border-red-200 bg-red-50 text-red-800',
        } as const;

        if (!sessionId) {
            if (paymentRoute === 'success') {
                return {
                    className: baseClasses.error,
                    title: 'Lien de paiement invalide',
                    message:
                        'Impossible de retrouver la session de paiement transmise. Veuillez relancer votre achat.',
                };
            }

            return {
                className: baseClasses.info,
                title: 'Paiement annulé',
                message:
                    'Vous avez interrompu la transaction avant son règlement. Aucun montant ne sera prélevé.',
            };
        }

        if (isPaymentStatusLoading) {
            return {
                className: baseClasses.info,
                title: 'Vérification du paiement',
                message: 'Nous vérifions le statut de votre transaction. Cela ne prend que quelques instants.',
            };
        }

        if (paymentStatusError) {
            return {
                className: baseClasses.error,
                title: 'Vérification du paiement impossible',
                message: paymentStatusError,
            };
        }

        if (!paymentStatus) {
            return null;
        }

        if (paymentStatus === 'PAID') {
            return {
                className: baseClasses.success,
                title: 'Paiement confirmé',
                message:
                    'Merci pour votre achat ! Votre paiement a bien été confirmé. Vos billets seront bientôt disponibles dans votre espace.',
            };
        }

        if (paymentStatus === 'PENDING') {
            return {
                className: baseClasses.info,
                title: 'Paiement en cours de validation',
                message:
                    'Votre transaction est en cours de traitement, veuillez patienter quelques instants.',
            };
        }

        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' || paymentStatus === 'CANCELED') {
            return {
                className: baseClasses.error,
                title: 'Paiement annulé',
                message:
                    "Le paiement n'a pas abouti. Aucun montant ne sera prélevé. Vous pouvez relancer votre commande depuis la billetterie.",
            };
        }

        return {
            className: baseClasses.warning,
            title: 'Statut du paiement',
            message: `Nous avons reçu le statut suivant : ${paymentStatus}. Si ce statut vous surprend, contactez notre support.`,
        };
    }, [isPaymentStatusLoading, paymentRoute, paymentStatus, paymentStatusError, sessionId]);

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
        const full_name = pickFirstValue(
            sessionUser?.full_name,
            `${firstName} ${lastName}`.trim(),
            email,
            'Client Jeux Olympiques',
        );

        return { firstName, lastName, email, full_name };
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

    const handleDownloadTicket = useCallback(async (ticket: Ticket, fallbackIndex: number) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        try {
            const resolvedTicketSecret = pickFirstValue(
                ticket.ticket_secret,
                ticket.ticket_secret,
            )
                ?.trim()
                ?? '';
            const resolvedTicketId = ticket.ticketId ?? ticket.ticket_id ?? null;
            const resolvedEntries = ticket.entriesAllowed ?? ticket.entries_allowed ?? null;
            const resolvedOfferName = pickFirstValue(ticket.offerName, ticket.offer_name);
            const resolvedTransactionStatus = pickFirstValue(
                ticket.transactionStatus,
                ticket.transaction_status,
            );

            const ticketIdLabel =
                resolvedTicketId != null ? String(resolvedTicketId) : `#${fallbackIndex + 1}`;
            const title = resolvedOfferName ?? `Billet ${ticketIdLabel}`;
            const ticketStatusLabel = pickFirstValue(ticket.status, 'INCONNU');
            const transactionStatusLabel = resolvedTransactionStatus ?? 'Non renseigné';
            const entriesLabel =
                typeof resolvedEntries === 'number' ? String(resolvedEntries) : 'Non renseigné';
            const amountLabel =
                typeof ticket.amount === 'number'
                    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                          ticket.amount,
                      )
                    : 'Non renseigné';
            const createdAtIso = pickFirstValue(ticket.createdAt, ticket.created_at);
            const createdAtLabel = formatTicketDate(createdAtIso) ?? 'Non renseigné';

            const qrDownloadUrl = resolvedTicketSecret
                ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(resolvedTicketSecret)}`
                : '';

            const sanitizedFileId =
                resolvedTicketId != null
                    ? `billet-${resolvedTicketId}`
                    : resolvedTicketSecret
                    ? `billet-${resolvedTicketSecret.replace(/[^\w-]+/g, '-')}`
                    : `billet-${fallbackIndex + 1}`;

            const [jsPdfCtor, qrDataUrl] = await Promise.all([
                loadJsPdf(),
                (async () => {
                    if (!qrDownloadUrl) {
                        return null;
                    }

                    try {
                        const response = await fetch(qrDownloadUrl, { mode: 'cors' });
                        if (!response.ok) {
                            throw new Error(`QR code request failed with status ${response.status}`);
                        }

                        const blob = await response.blob();
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error('Impossible de lire le QR code'));
                            reader.readAsDataURL(blob);
                        });

                        return dataUrl;
                    } catch (err) {
                        console.error('Impossible de générer le QR code pour le billet', err);
                        return null;
                    }
                })(),
            ]);

            const doc = new jsPdfCtor({ unit: 'pt', format: 'a4' });
            const margin = 48;
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFillColor(198, 176, 101);
            doc.roundedRect(margin, margin, pageWidth - margin * 2, 140, 18, 18, 'F');

            doc.setTextColor(236, 245, 255);
            doc.setFontSize(12);
            doc.text('Billet officiel', margin + 24, margin + 36);

            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin + 24, margin + 80, { maxWidth: pageWidth - margin * 2 - 48 });

            doc.setFillColor(255, 255, 255);
            const detailsTop = margin + 200;
            const detailsHeight = qrDataUrl ? 250 : 210;
            doc.roundedRect(margin, detailsTop, pageWidth - margin * 2, detailsHeight, 16, 16, 'F');

            const detailEntries = [
                { label: 'Montant payé', value: amountLabel },
                { label: "Entrées", value: entriesLabel },
                { label: "Date d'achat", value: createdAtLabel },
            ];

            const columnWidth = (pageWidth - margin * 2 - 64) / 2;
            const detailStartX = margin + 32;
            const detailStartY = detailsTop + 48;
            const lineSpacing = 64;

            detailEntries.forEach((detail, idx) => {
                const column = idx % 2;
                const row = Math.floor(idx / 2);
                const x = detailStartX + column * columnWidth;
                const y = detailStartY + row * lineSpacing;

                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(detail.label.toUpperCase(), x, y);

                doc.setFontSize(14);
                doc.setTextColor(15, 23, 42);
                doc.text(String(detail.value ?? '—'), x, y + 20, {
                    maxWidth: columnWidth - 12,
                });
            });

            if (qrDataUrl) {
                const qrSize = 140;
                const qrX = pageWidth - margin - qrSize - 32;
                const qrY = detailsTop + 40;

                doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
            }

            const footerY = detailsTop + detailsHeight + 50;
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(1);
            doc.setLineDashPattern([4, 4], 0);
            doc.line(margin, footerY, pageWidth - margin, footerY);

            doc.setLineDashPattern([], 0);
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105);
            doc.text(`Téléchargé le ${formatTicketDate(new Date().toISOString())}`, margin, footerY + 24);
            doc.text('Merci pour votre confiance.', pageWidth - margin - 200, footerY + 24);

            doc.save(`${sanitizedFileId}.pdf`);
        } catch (error) {
            console.error('Échec lors de la génération du billet PDF', error);

            if (typeof window !== 'undefined') {
                window.alert('Impossible de générer votre billet pour le moment. Veuillez réessayer plus tard.');
            }
        }
    }, []);

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
                                Heureux de vous retrouver, {identity.full_name}. Retrouvez vos informations et vos billets
                                en un clin d&apos;oeil.
                            </p>
                        </div>
                    </div>

                    {paymentBanner && (
                        <div className={`rounded-2xl border px-5 py-4 text-sm ${paymentBanner.className}`}>
                            <p className="text-base font-semibold">{paymentBanner.title}</p>
                            {paymentBanner.message && (
                                <p className="mt-1 text-sm leading-relaxed text-current">{paymentBanner.message}</p>
                            )}
                        </div>
                    )}

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
                                Vous n&apos;avez pas encore de billets. Utilisez le bouton "Voir les offres" pour
                                découvrir les prochaines disponibilités.
                            </p>
                        ) : (
                            <ul className="mt-6 space-y-4">
                                {tickets.map((ticket, index) => {
                                    const resolvedTicketId = ticket.ticketId ?? ticket.ticket_id ?? null;
                                    const ticket_secret = pickFirstValue(
                                        ticket.ticket_secret,
                                        ticket.ticket_secret,
                                    );
                                    const normalizedTicketSecret = ticket_secret?.trim() ?? '';
                                    const qrCodeUrl = normalizedTicketSecret
                                        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(normalizedTicketSecret)}`
                                        : null;
                                    const formattedAmount =
                                        typeof ticket.amount === 'number'
                                            ? new Intl.NumberFormat('fr-FR', {
                                                  style: 'currency',
                                                  currency: 'EUR',
                                              }).format(ticket.amount)
                                            : null;
                                    const createdAtIso = pickFirstValue(ticket.createdAt, ticket.created_at);
                                    const creationLabel = formatTicketDate(createdAtIso) ?? null;
                                    const entriesValue = ticket.entriesAllowed ?? ticket.entries_allowed;
                                    const entriesLabel =
                                        typeof entriesValue === 'number' ? entriesValue.toString() : null;
                                    const transactionStatusValue = pickFirstValue(
                                        ticket.transactionStatus,
                                        ticket.transaction_status,
                                    );
                                    const ticketStatusValue = pickFirstValue(ticket.status);
                                    const normalizedTicketStatus = ticketStatusValue
                                        ? ticketStatusValue.toUpperCase()
                                        : '';
                                    const isTicketUsed =
                                        normalizedTicketStatus.includes('USED') ||
                                        normalizedTicketStatus.includes('SCANNED');
                                    const details = [
                                        {
                                            label: 'Montant payé',
                                            value: formattedAmount,
                                        },
                                        {
                                            label: "Nombre d'entrées",
                                            value: entriesLabel,
                                        },
                                        {
                                            label: "Date d'achat",
                                            value: creationLabel,
                                        },
                                    ].filter(
                                        (detail) =>
                                            detail.value !== null &&
                                            String(detail.value).trim().length > 0,
                                    );

                                    const offerName = pickFirstValue(ticket.offerName, ticket.offer_name);
                                    const title =
                                        offerName?.trim().length
                                            ? offerName
                                            : `Billet ${resolvedTicketId ?? index + 1}`;

                                    const resolveBadgeClasses = (value?: string | null) => {
                                        if (!value || !value.trim()) {
                                            return null;
                                        }

                                        const normalized = value.trim().toUpperCase();
                                        const base =
                                            'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide';

                                        if (normalized === 'PAID' || normalized === 'CONFIRMED') {
                                            return {
                                                label: normalized,
                                                className: `${base} border-emerald-200 bg-emerald-100 text-emerald-700`,
                                            };
                                        }

                                        if (normalized === 'PENDING' || normalized === 'PROCESSING') {
                                            return {
                                                label: normalized,
                                                className: `${base} border-amber-200 bg-amber-100 text-amber-800`,
                                            };
                                        }

                                        if (
                                            normalized === 'FAILED' ||
                                            normalized === 'CANCELLED' ||
                                            normalized === 'CANCELED' ||
                                            normalized === 'REFUSED'
                                        ) {
                                            return {
                                                label: normalized,
                                                className: `${base} border-rose-200 bg-rose-100 text-rose-700`,
                                            };
                                        }

                                        return {
                                            label: normalized,
                                            className: `${base} border-slate-200 bg-slate-100 text-slate-700`,
                                        };
                                    };

                                    const ticketStatusBadge = resolveBadgeClasses(ticketStatusValue);
                                    const transactionStatusBadge = resolveBadgeClasses(
                                        transactionStatusValue,
                                    );

                                    return (
                                        <Card
                                            as="li"
                                            key={String(resolvedTicketId ?? normalizedTicketSecret ?? index)}
                                            variant="default"
                                            padding="p-0"
                                            className={clsx(
                                                'overflow-hidden border-primary-100 bg-gradient-to-br from-white via-primary-50/50 to-white shadow-lg',
                                                isTicketUsed && 'opacity-70',
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-6 text-white">
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-100/90">
                                                                Billet officiel
                                                            </p>
                                                            <p className="mt-2 text-2xl font-semibold">{title}</p>
                                                        </div>
                                                    </div>
                                                    {normalizedTicketSecret && (
                                                        <div className="pointer-events-none absolute -right-16 top-1/2 hidden h-24 w-24 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 blur-md lg:block" />
                                                    )}
                                                </div>

                                                <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.6fr_auto] md:items-center">
                                                    <div className="space-y-4">
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {details.map((detail) => (
                                                                <div
                                                                    key={`${resolvedTicketId ?? normalizedTicketSecret ?? index}-${detail.label}`}
                                                                    className="flex flex-col rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur"
                                                                >
                                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                        {detail.label}
                                                                    </span>
                                                                    <span className="mt-1 text-sm font-medium text-gray-900">
                                                                        {detail.value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {qrCodeUrl && (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-white p-3 shadow-md">
                                                                <img
                                                                    src={qrCodeUrl}
                                                                    alt={`QR code ticket_secret pour le billet ${resolvedTicketId ?? normalizedTicketSecret}`}
                                                                    className="h-36 w-36 rounded-lg bg-white object-contain"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-3 border-t border-dashed border-primary-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                    {isTicketUsed ? (
                                                        <p className="text-sm font-medium text-rose-600">
                                                            Ce billet a déjà été scanné.
                                                        </p>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="w-full sm:w-auto"
                                                            onClick={() => {
                                                                void handleDownloadTicket(ticket, index);
                                                            }}
                                                        >
                                                            Télécharger mon billet
                                                        </Button>
                                                    )}
                                                </div>
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
