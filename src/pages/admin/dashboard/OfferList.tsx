import React from 'react';
import Card from '@/components/Card';
import Title from '@/components/Title';
import { Button } from '@/components/Button';
import { AdminOffer } from '@/lib/api';

interface OfferListProps {
    offers: AdminOffer[];
    isLoading: boolean;
    listError: string | null;
    onEdit: (offer: AdminOffer) => void;
    onDelete: (offer: AdminOffer) => void;
}

const OfferList: React.FC<OfferListProps> = ({ offers, isLoading, listError, onEdit, onDelete }) => {
    if (isLoading)
        return (
            <Card className="flex items-center justify-center py-12 text-gray-500">
                Chargement des offres...
            </Card>
        );

    if (listError)
        return (
            <Card className="border-red-400 bg-red-50 text-red-700 p-4">
                {listError}
            </Card>
        );

    if (offers.length === 0)
        return (
            <Card className="flex items-center justify-center py-10 text-gray-500 border-dashed border">
                Aucune offre disponible.
            </Card>
        );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
            {offers.map((offer) => (
                <Card key={offer.id} className="p-5 shadow-md border-gray-200 hover:shadow-lg transition">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-lg font-semibold text-primary-700">{offer.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                            <div className="mt-4 text-sm text-gray-700">
                                <p>Prix : <span className="font-semibold">{offer.price} €</span></p>
                                <p>Personnes : <span className="font-semibold">{offer.persons}</span></p>
                                <p>Quantité : <span className="font-semibold">{offer.quantity}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button variant="secondary" size="sm" onClick={() => onEdit(offer)}>Modifier</Button>
                            <Button variant="danger" size="sm" onClick={() => onDelete(offer)}>Supprimer</Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default OfferList;
