export default function Footer() {
    return (
        <footer className="bg-primary-500 text-gray-50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
                {/* Identité */}
                <div className={"flex flex-col items-center lg:items-center"}>
                    <img src="/imgs/logo.png" alt="Logo JO 2024 France" className="h-30 mx-auto mb-4" style={{ filter: 'brightness(0) invert(1)' }} />
                    <h2 className="text-2xl font-bold uppercase tracking-wide">
                        JO 2024 France
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-gray-50/80">
                        Plateforme officielle pour réserver vos billets des Jeux Olympiques et Paralympiques de Paris 2024.
                        Profitez d&apos;une expérience sécurisée, d&apos;un suivi en temps réel et d&apos;un support dédié.
                    </p>
                </div>

                {/* Navigation principale */}
                <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-gray-50">
                        Navigation
                    </h3>
                    <ul className="mt-4 space-y-2 text-sm text-gray-100/90">
                        <li><a href="/" className="transition hover:text-gray-200">Accueil</a></li>
                        <li><a href="/offers" className="transition hover:text-gray-200">Billetterie &amp; offres</a></li>
                        <li><a href="/account" className="transition hover:text-gray-200">Mon espace</a></li>
                        <li><a href="/login" className="transition hover:text-gray-200">Connexion</a></li>
                        <li><a href="/register" className="transition hover:text-gray-200">Créer un compte</a></li>
                    </ul>
                </div>

                {/* Assistance */}
                <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-gray-50">
                        Assistance &amp; contact
                    </h3>
                    <ul className="mt-4 space-y-2 text-sm text-gray-100/90">
                        <li>
                            Email : <a href="mailto:support@jo2024.fr" className="font-semibold hover:text-gray-200 transition">
                                support@jo2024.fr
                            </a>
                        </li>
                        <li>Téléphone : +33 1 23 45 67 89</li>
                        <li>Service client : lun - sam, 9h à 19h CET</li>
                        <li>
                            <a
                                href="https://support.paris2024.org/hc/fr"
                                className="transition hover:text-gray-200"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Centre d&apos;aide officiel
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Ressources */}
                <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-gray-50">
                        Ressources &amp; actualités
                    </h3>
                    <ul className="mt-4 space-y-2 text-sm text-gray-100/90">
                        <li>
                            <a
                                href="https://www.paris2024.org/fr/calendrier-des-epreuves/"
                                className="transition hover:text-gray-200"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Calendrier des épreuves
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://tickets.paris2024.org/fr/faq"
                                className="transition hover:text-gray-200"
                                target="_blank"
                                rel="noreferrer"
                            >
                                FAQ billetterie
                            </a>
                        </li>
                        <li><a href="https://www.instagram.com/paris2024" className="transition hover:text-gray-200" target="_blank" rel="noreferrer">Instagram officiel</a></li>
                        <li><a href="https://twitter.com/Paris2024" className="transition hover:text-gray-200" target="_blank" rel="noreferrer">X (Twitter) @Paris2024</a></li>
                        <li><a href="https://www.youtube.com/paris2024" className="transition hover:text-gray-200" target="_blank" rel="noreferrer">YouTube Paris 2024</a></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-primary-400/60 px-6 py-4 text-center text-xs text-gray-50/80 sm:text-sm">
                &copy; {new Date().getFullYear()} JO 2024 France — Billetterie officielle. Tous droits réservés.
            </div>
        </footer>
    );
}
