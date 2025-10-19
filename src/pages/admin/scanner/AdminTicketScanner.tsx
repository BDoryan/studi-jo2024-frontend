import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import Card from '@/components/Card';
import { Button } from '@/components/Button';
import { ADMIN_DASHBOARD_PATH } from '@/pages/admin/constants';
import { AdminApi, HttpError, TicketScanResponse } from '@/lib/api';
import { useAdminAuth } from '@/lib/admin';

const describeApiMessage = (code?: string): string => {
    if (!code) return '';
    switch (code) {
        case 'ticket_not_found':
            return 'Billet introuvable. Vérifiez le QR code et réessayez.';
        case 'ticket_already_used':
            return 'Ce billet a déjà été validé.';
        case 'ticket_validated_successfully':
            return 'Billet validé avec succès.';
        case 'access_denied':
            return 'Accès refusé. Vérifiez vos droits administrateur.';
        default:
            return code
                .split('_')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
    }
};

const resolveApiError = (cause: unknown, fallback: string): string => {
    if (cause instanceof HttpError) {
        const details = cause.details;
        if (details && typeof details === 'object') {
            const data = details as Record<string, unknown>;
            const message =
                typeof data.message === 'string'
                    ? data.message
                    : typeof data.error === 'string'
                    ? data.error
                    : undefined;
            if (message) {
                return describeApiMessage(message);
            }
        }
        if (cause.message?.trim()) {
            return describeApiMessage(cause.message) || cause.message;
        }
    }
    if (cause instanceof Error && cause.message) {
        return cause.message;
    }
    return fallback;
};

const formatDateTime = (value?: string): string => {
    if (!value) return '—';
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

const formatAmount = (value?: number): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }
    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${value} €`;
    }
};

const computeStatusVisuals = (status?: string) => {
    if (!status) {
        return {
            label: 'Inconnu',
            className: 'border-gray-200 bg-gray-100 text-gray-700',
        };
    }

    const normalized = status.toUpperCase();

    if (normalized === 'USED') {
        return {
            label: 'Utilisé',
            className: 'border-red-200 bg-red-50 text-red-700',
        };
    }

    if (['ACTIVE', 'VALID', 'AVAILABLE'].includes(normalized)) {
        return {
            label: 'Valide',
            className: 'border-green-200 bg-green-50 text-green-700',
        };
    }

    if (['PENDING', 'WAITING', 'IN_PROGRESS'].includes(normalized)) {
        return {
            label: 'En attente',
            className: 'border-amber-200 bg-amber-50 text-amber-700',
        };
    }

    return {
        label: status,
        className: 'border-gray-200 bg-gray-100 text-gray-700',
    };
};

const AdminTicketScanner: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAdminAuth();
    const adminApi = useMemo(() => new AdminApi(() => token), [token]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [scannedSecret, setScannedSecret] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isFetchingTicket, setIsFetchingTicket] = useState(false);
    const [scanApiError, setScanApiError] = useState<string | null>(null);
    const [ticketData, setTicketData] = useState<TicketScanResponse | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationFeedback, setValidationFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        const scanner = new BrowserMultiFormatReader();
        let isMounted = true;

        const startScanning = async () => {
            const videoElement = videoRef.current;
            if (!videoElement) {
                if (isMounted) {
                    requestAnimationFrame(startScanning);
                }
                return;
            }

            try {
                controlsRef.current = await scanner.decodeFromVideoDevice(
                    undefined,
                    videoElement,
                    (result, error) => {
                        if (!isMounted) return;
                        if (result) {
                            const decoded = result.getText().trim();
                            if (decoded) {
                                setScannedSecret((prev) => (prev === decoded ? prev : decoded));
                            }
                        }
                        if (error && !(error instanceof NotFoundException)) {
                            console.error(error);
                            setScannerError("Une erreur est survenue lors de la lecture du billet.");
                        }
                    }
                );
                if (isMounted) {
                    setScannerError(null);
                    setIsCameraReady(true);
                }
            } catch (error) {
                console.error(error);
                if (!isMounted) return;
                setScannerError(
                    "Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur."
                );
                setIsCameraReady(false);
            }
        };

        void startScanning();

        return () => {
            isMounted = false;
            controlsRef.current?.stop();
            controlsRef.current = null;
            const videoElement = videoRef.current;
            const stream = videoElement?.srcObject as MediaStream | null;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!scannedSecret) {
            return;
        }

        let ignore = false;
        const secret = scannedSecret.trim();

        if (!secret) {
            return;
        }

        setIsFetchingTicket(true);
        setScanApiError(null);
        setValidationFeedback(null);
        setTicketData(null);

        const fetchTicket = async () => {
            try {
                const response = await adminApi.scanTicket({ ticket_secret: secret });
                if (ignore) return;
                setTicketData(response);
            } catch (error) {
                if (ignore) return;
                setScanApiError(resolveApiError(error, 'Impossible de vérifier le billet.'));
            } finally {
                if (!ignore) {
                    setIsFetchingTicket(false);
                }
            }
        };

        void fetchTicket();

        return () => {
            ignore = true;
        };
    }, [adminApi, scannedSecret]);

    const handleResetScan = useCallback(() => {
        setScannedSecret(null);
        setTicketData(null);
        setScanApiError(null);
        setValidationFeedback(null);
        setIsFetchingTicket(false);
    }, []);

    const handleValidateTicket = useCallback(async () => {
        if (!scannedSecret) {
            return;
        }

        const secret = scannedSecret.trim();
        if (!secret) {
            return;
        }

        setIsValidating(true);
        setValidationFeedback(null);

        try {
            const response = await adminApi.validateTicket({ ticket_secret: secret });
            const message = describeApiMessage(response.message) || 'Billet validé avec succès.';
            setValidationFeedback({ type: 'success', message });
            setTicketData((prev) => (prev ? { ...prev, status: 'USED' } : prev));
        } catch (error) {
            setValidationFeedback({
                type: 'error',
                message: resolveApiError(error, 'Impossible de valider le billet.'),
            });
        } finally {
            setIsValidating(false);
        }
    }, [adminApi, scannedSecret]);

    const isTicketAlreadyUsed = ticketData?.status?.toUpperCase() === 'USED';
    const statusVisuals = computeStatusVisuals(ticketData?.status);

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Contrôle des billets</p>
                        <h1 className="text-2xl font-semibold text-primary-600">Scanner les billets</h1>
                        <p className="text-sm text-gray-500">
                            Présentez le QR code devant la caméra pour vérifier le billet.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" size="sm" onClick={handleResetScan}>
                            Effacer le dernier scan
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(ADMIN_DASHBOARD_PATH)}>
                            Retour au tableau de bord
                        </Button>
                    </div>
                </Card>

                <Card className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Flux caméra</h2>
                            <p className="text-sm text-gray-500">
                                Assurez-vous que votre navigateur autorise l&apos;accès à la caméra.
                            </p>
                        </div>
                        {!isCameraReady && !scannerError && (
                            <span className="text-sm font-medium text-primary-500">Initialisation de la caméra…</span>
                        )}
                    </div>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black sm:aspect-video">
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            playsInline
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-40 w-40 border-2 border-primary-400/80 sm:h-56 sm:w-56" />
                        </div>
                    </div>
                    {scannerError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {scannerError}
                        </div>
                    )}
                </Card>

                <Card className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Résultat du scan</h2>
                            <p className="text-sm text-gray-500">
                                Les informations du billet s&apos;afficheront automatiquement après la lecture du QR code.
                            </p>
                        </div>
                        {scannedSecret ? (
                            <code className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900">
                                {scannedSecret}
                            </code>
                        ) : (
                            <span className="text-sm font-medium text-gray-400">QR code en attente…</span>
                        )}
                    </div>

                    {isFetchingTicket && (
                        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                            Vérification du billet en cours…
                        </div>
                    )}

                    {scanApiError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {scanApiError}
                        </div>
                    )}

                    {ticketData && (
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                        Billet
                                    </span>
                                    <div className="grid gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Statut
                                            </span>
                                            <span
                                                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusVisuals.className}`}
                                            >
                                                {statusVisuals.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Entrées autorisées
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {typeof ticketData.entries_allowed === 'number'
                                                    ? ticketData.entries_allowed
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Offre associée
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {ticketData.offer_name ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Montant
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatAmount(ticketData.amount)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Créé le
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatDateTime(ticketData.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                        Client
                                    </span>
                                    <div className="grid gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Prénom
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {ticketData.customer?.first_name ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Nom
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {ticketData.customer?.last_name ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">
                                                Email
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {ticketData.customer?.email ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Valider le passage
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Confirmez l&apos;identité du visiteur avant de désactiver le billet.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleValidateTicket}
                                        disabled={isValidating || isTicketAlreadyUsed}
                                    >
                                        {isTicketAlreadyUsed
                                            ? 'Billet déjà utilisé'
                                            : isValidating
                                            ? 'Validation en cours…'
                                            : 'Valider ce billet'}
                                    </Button>
                                </div>
                                {validationFeedback && (
                                    <div
                                        className={`rounded-xl border px-4 py-3 text-sm ${
                                            validationFeedback.type === 'success'
                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                : 'border-red-200 bg-red-50 text-red-600'
                                        }`}
                                    >
                                        {validationFeedback.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!scannedSecret && (
                        <p className="text-sm text-gray-500">
                            Aucun QR code scanné pour le moment. Placez un billet devant la caméra pour commencer.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminTicketScanner;
