import React from 'react';
import Title from '@/components/Title';
import Layout from '@/components/Layout';
import Card from '@/components/Card';

const Offers: React.FC = () => {
    return (
        <Layout>
            <main className="flex flex-1 items-center justify-center px-4 py-16">
                <Card
                    as="section"
                    className="w-full max-w-3xl border-dashed text-center"
                    padding="p-10"
                >
                    <Title level={1} className="text-primary-500">
                        Offres
                    </Title>
                    <p className="mt-4 text-sm text-gray-600">
                        Cette page sera bientôt disponible. Revenez très vite pour découvrir toutes les offres.
                    </p>
                </Card>
            </main>
        </Layout>
    );
};

export default Offers;
