import React, {useCallback, useState} from 'react';
import Card from '@/components/Card';
import Title from '@/components/Title';
import {Button} from '@/components/Button';
import {AdminApi, AdminOffer, AdminIdentifier, AdminOfferInput} from '@/lib/api';
import {translateMessage} from '@/lib/i18n';
import type {OfferFormState} from './AdminDashboard';

interface OfferFormProps {
    adminApi: AdminApi;
    activeOfferId: AdminIdentifier | null;
    setActiveOfferId: (id: AdminIdentifier | null) => void;
    offers: AdminOffer[];
    setOffers: React.Dispatch<React.SetStateAction<AdminOffer[]>>;
    formState: OfferFormState;
    setFormState: React.Dispatch<React.SetStateAction<OfferFormState>>;
    initialForm: OfferFormState;
}

const OfferForm: React.FC<OfferFormProps> = ({
                                                 adminApi,
                                                 activeOfferId,
                                                 setActiveOfferId,
                                                 offers,
                                                 setOffers,
                                                 formState,
                                                 setFormState,
                                                 initialForm,
                                             }) => {
    const [formBusy, setFormBusy] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormState((prev) => ({...prev, [name]: value}));
    }, []);

    const resetForm = useCallback(() => {
        setActiveOfferId(null);
        setFormState(initialForm);
        setFeedback(null);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setFormBusy(true);
            setFeedback(null);

            try {
                const payload: AdminOfferInput = {
                    name: formState.name,
                    description: formState.description,
                    price: Number(formState.price),
                    persons: Number(formState.persons),
                    quantity: Number(formState.quantity),
                };

                if (activeOfferId) {
                    const updated = await adminApi.updateOffer(activeOfferId, payload);
                    setOffers((prev) => prev.map((o) => (o.id === activeOfferId ? updated : o)));
                    setFeedback({type: 'success', message: 'Offre mise à jour avec succès.'});
                } else {
                    const created = await adminApi.createOffer(payload);
                    setOffers((prev) => [created, ...prev]);
                    setFeedback({type: 'success', message: 'Offre créée avec succès.'});
                    setFormState(initialForm);
                }
            } catch {
                setFeedback({type: 'error', message: 'Une erreur est survenue.'});
            } finally {
                setFormBusy(false);
            }
        },
        [activeOfferId, formState],
    );

    return (
        <Card className="border-gray-200 bg-white shadow-md">
            <Title level={4} className="text-xl text-primary-600">
                {activeOfferId ? 'Modifier une offre' : 'Créer une nouvelle offre'}
            </Title>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <input name="name" value={formState.name} onChange={handleChange} placeholder="Nom de l’offre"
                       className="w-full rounded-lg border border-gray-300 px-3 py-2"/>
                <textarea name="description" value={formState.description} onChange={handleChange}
                          placeholder="Description" className="w-full rounded-lg border border-gray-300 px-3 py-2"/>
                <input name="price" value={formState.price} onChange={handleChange} placeholder="Prix (€)"
                       className="w-full rounded-lg border border-gray-300 px-3 py-2"/>
                <input name="persons" value={formState.persons} onChange={handleChange}
                       placeholder="Nombre de personnes"
                       className="w-full rounded-lg border border-gray-300 px-3 py-2"/>
                <input name="quantity" value={formState.quantity} onChange={handleChange} placeholder="Quantité"
                       className="w-full rounded-lg border border-gray-300 px-3 py-2"/>
                <div className="flex-row md:flex-col flex gap-3">
                    {activeOfferId && (
                        <Button className={"flex-1"} type="button" variant="outline" onClick={resetForm}>
                            Retour
                        </Button>
                    )}
                    <Button type="submit" disabled={formBusy} className="flex-1">
                        {activeOfferId ? 'Mettre à jour cette offre' : 'Créer une nouvelle offre'}
                    </Button>
                </div>
                {feedback && (
                    <p className={`text-sm mt-2 ${feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {feedback.message}
                    </p>
                )}
            </form>
        </Card>
    );
};

export default OfferForm;
