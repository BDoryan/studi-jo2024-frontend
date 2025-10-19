import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Title from '@/components/Title';
import Card from '@/components/Card';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-20">
        <Card className="w-full max-w-2xl border-dashed text-center" padding="p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-500">
            Erreur 404
          </p>
          <Title level={1} className="mt-4 text-4xl text-primary-600 md:text-5xl">
            Page introuvable
          </Title>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-600">
            La page que vous recherchez n’existe pas ou a été déplacée. Utilisez le bouton ci-dessous
            pour revenir à l’accueil et poursuivre votre navigation.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Retour à l’accueil
            </Link>
          </div>
        </Card>
      </main>
    </Layout>
  );
};

export default NotFound;
