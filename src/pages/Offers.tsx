import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import Card from '@/components/Card';
import { useAuth } from '@/lib/auth/AuthContext';
import { Offer, OfferApi, OfferIdentifier, PaymentsApi } from '@/lib/api';

const parseNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
};

const Offers: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [processingOfferId, setProcessingOfferId] = useState<OfferIdentifier | null>(null);
    const offerApi = useMemo(() => new OfferApi(), []);
    const paymentsApi = useMemo(() => new PaymentsApi(), []);

    useEffect(() => {
        let isActive = true;

        const loadOffers = async () => {
            setIsLoading(true);
            try {
                const data = await offerApi.list();

                if (!isActive) {
                    return;
                }

                setOffers(Array.isArray(data) ? data : []);
                setError(null);
                setCheckoutError(null);
            } catch (err) {
                console.error('Failed to fetch offers', err);
                if (isActive) {
                    setError("Impossible de récupérer les offres pour le moment.");
                    setOffers([]);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadOffers();

        return () => {
            isActive = false;
        };
    }, [offerApi]);

    const handleCheckout = useCallback(
        async (offer: Offer) => {
            if (!offer?.id) {
                setCheckoutError("Cette offre est indisponible pour le moment.");
                return;
            }

            setCheckoutError(null);
            setProcessingOfferId(offer.id);

            try {
                const response = await paymentsApi.checkout({ offer_id: offer.id });

                const checkout_url =
                    response
                        ? response.checkout_url.trim()
                        : '';

                if (!checkout_url) {
                    throw new Error('Missing checkout_url in payment response');
                }

                window.location.assign(checkout_url);
            } catch (err) {
                console.error('Failed to start checkout', err);
                setCheckoutError("Impossible de lancer le paiement. Veuillez réessayer.");
            } finally {
                setProcessingOfferId(null);
            }
        },
        [paymentsApi],
    );

    return (
        <Layout>
            <main className="flex flex-col items-center justify-center px-4 py-16">
                <Title level={1} className="text-3xl font-bold text-center mb-4">
                    Choisissez votre formule de billet
                </Title>
                <p className="text-center text-gray-700 max-w-4xl mb-10">
                    Des offres adaptées pour vivre pleinement les Jeux Olympiques de Paris 2024.<br />
                    Trouvez celle qui correspond le mieux à vos envies et à votre budget et préparez-vous à vivre des moments inoubliables !
                </p>

                {!isAuthenticated && (
                    <div className="text-center w-full max-w-6xl mb-8 rounded-xl border border-primary-300 bg-primary-200 px-6 py-2 text-primary-800">
                        Vous devez être connecté afin de pouvoir éffectuer un achat sur la billetterie
                    </div>
                )}

                {isLoading && (
                    <div className="w-full max-w-6xl text-center text-gray-600">
                        Chargement des offres…
                    </div>
                )}

                {error && !isLoading && (
                    <div className="w-full max-w-6xl mb-8 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-800">
                        {error}
                    </div>
                )}

                {checkoutError && !isLoading && !error && (
                    <div className="w-full max-w-6xl mb-8 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-800">
                        {checkoutError}
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="grid gap-8 md:grid-cols-3 w-full max-w-6xl">
                        {offers.map((offer) => {
                            const quantityValue =
                                parseNumber(offer.quantity) ?? parseNumber((offer as Record<string, unknown>).quantity_left);
                            const hasStock = quantityValue == null ? true : quantityValue > 0;

                            const personsValue = parseNumber(offer.persons);
                            const personsLabel =
                                personsValue != null
                                    ? `${personsValue} ${personsValue > 1 ? 'personnes' : 'personne'}`
                                    : null;

                            const priceValue = parseNumber(offer.price);
                            const priceLabel =
                                priceValue != null
                                    ? `${priceValue.toLocaleString('fr-FR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 2,
                                      })} €`
                                    : null;

                            const description =
                                typeof offer.description === 'string' ? offer.description : '';
                            const title =
                                typeof offer.name === 'string' && offer.name.trim().length > 0
                                    ? offer.name
                                    : 'Offre';

                            return (
                                <Card
                                    key={String(offer.id ?? title)}
                                    className="flex flex-col items-center text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex-1 justify-center">
                                        <h2 className="text-lg font-bold mt-2">{title}</h2>
                                        {personsLabel && (
                                            <p className="text-sm text-gray-500 mb-4">{personsLabel}</p>
                                        )}
                                        {description && (
                                            <p className="text-gray-700 mb-6 whitespace-pre-line">{description}</p>
                                        )}
                                        {priceLabel && (
                                            <p className="text-3xl font-bold mb-6">{priceLabel}</p>
                                        )}
                                    </div>
                                    <Button
                                        disabled={
                                            !isAuthenticated || !hasStock || processingOfferId === offer.id
                                        }
                                        onClick={() => handleCheckout(offer)}
                                        variant="secondary"
                                    >
                                        {processingOfferId === offer.id ? 'Redirection…' : 'Acheter cette offre'}
                                    </Button>
                                </Card>
                            );
                        })}

                        {offers.length === 0 && (
                            <div className="col-span-full text-center text-gray-600">
                                Aucune offre disponible pour le moment.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </Layout>
    );
};

export default Offers;
