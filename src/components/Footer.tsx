export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Section 1 : Logo & présentation */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                        JO 2024 France
                    </h2>
                    <p className="text-sm leading-relaxed">
                        Réservez vos billets officiels pour les Jeux Olympiques de Paris 2024.
                        Une expérience 100 % sécurisée, rapide et digitale.
                    </p>
                </div>

                {/* Section 2 : Liens utiles */}
                <div>
                    <h3 className="text-white font-semibold mb-3">Navigation</h3>
                    <ul className="space-y-2">
                        <li><a href="/" className="hover:text-white transition">Accueil</a></li>
                        <li><a href="/offers" className="hover:text-white transition">Offres</a></li>
                        <li><a href="/login" className="hover:text-white transition">Connexion</a></li>
                        <li><a href="/register" className="hover:text-white transition">Inscription</a></li>
                    </ul>
                </div>

                {/* Section 3 : Contact */}
                <div>
                    <h3 className="text-white font-semibold mb-3">Contact</h3>
                    <p className="text-sm">Email : <a href="mailto:support@jo2024.fr" className="text-blue-400 hover:underline">support@jo2024.fr</a></p>
                    <p className="text-sm mt-1">Téléphone : +33 1 23 45 67 89</p>
                    <p className="text-sm mt-1">Adresse : Paris, France</p>
                </div>

                {/* Section 4 : Réseaux sociaux */}
                <div>
                    <h3 className="text-white font-semibold mb-3">Mon compte</h3>

                </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
                © {new Date().getFullYear()} Jeux Olympiques France — Tous droits réservés.
            </div>
        </footer>
    );
}
