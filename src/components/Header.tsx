import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
}

const navigationLinks = [
    { label: 'Accueil', to: '/' },
    { label: 'Les offres', to: '/offers' },
];

const Header: React.FC<HeaderProps> = ({ onLoginClick, onRegisterClick }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, logout } = useAuth();

    const handleNavigate = useCallback(
        (path: string) => {
            setIsMenuOpen(false);
            navigate(path);
        },
        [navigate],
    );

    const handleLogin = useCallback(() => {
        setIsMenuOpen(false);

        if (onLoginClick) {
            onLoginClick();
            return;
        }

        navigate('/login');
    }, [navigate, onLoginClick]);

    const handleRegister = useCallback(() => {
        setIsMenuOpen(false);

        if (onRegisterClick) {
            onRegisterClick();
            return;
        }

        navigate('/register');
    }, [navigate, onRegisterClick]);

    const handleAccount = useCallback(() => {
        setIsMenuOpen(false);
        navigate('/account');
    }, [navigate]);

    const handleLogout = useCallback(() => {
        setIsMenuOpen(false);
        logout();
        navigate('/');
    }, [logout, navigate]);

    return (
        <header className="sticky top-0 z-40 bg-white/90 shadow backdrop-blur">
            <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-4">
                    <img src="/imgs/logo.png" alt="Jeux Olympiques 2024" className="h-12 w-12 sm:h-14 sm:w-14" />
                    <img
                        src="/imgs/logo-paralympiques.png"
                        alt="Jeux Paralympiques 2024"
                        className="h-12 w-12 sm:h-14 sm:w-14"
                    />
                </Link>

                <nav className="hidden items-center gap-6 lg:flex">
                    {navigationLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="text-sm font-semibold uppercase tracking-wide text-gray-600 transition hover:text-primary-500"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {isAuthenticated && (
                        <Link
                            to="/account"
                            className="text-sm font-semibold uppercase tracking-wide text-primary-500 transition hover:text-primary-600"
                        >
                            Mon compte
                        </Link>
                    )}
                </nav>

                {isAuthenticated ? (
                    <div className="hidden items-center gap-3 lg:flex">
                        <Button variant="primary" type="button" onClick={handleAccount}>
                            Mon compte
                        </Button>
                        <Button variant="danger" type="button" onClick={handleLogout}>
                            Se déconnecter
                        </Button>
                    </div>
                ) : (
                    <div className="hidden items-center gap-2 lg:flex">
                        <Button variant="primary" type="button" onClick={handleLogin}>
                            Se connecter
                        </Button>
                        <Button variant="outline" type="button" onClick={handleRegister}>
                            Créer un compte
                        </Button>
                    </div>
                )}

                <button
                    type="button"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-primary-400 hover:text-primary-500 lg:hidden"
                    aria-label="Ouvrir le menu"
                    aria-controls="main-navigation"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen(true)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-6 w-6"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <div
                className={`fixed inset-0 z-50 transform transition duration-300 ease-out lg:hidden ${
                    isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
                aria-hidden={!isMenuOpen}
            >
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                        isMenuOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                />

                <div
                    className={`min-h-[100vh] absolute inset-y-0 left-0 flex w-80 max-w-[85%] transform flex-col gap-6 bg-white p-6 shadow-xl transition-transform duration-300 ${
                        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    id="main-navigation"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/imgs/logo.png" alt="Jeux Olympiques 2024" className="h-12 w-12" />
                            <img src="/imgs/logo-paralympiques.png" alt="Jeux Paralympiques 2024" className="h-12 w-12" />
                        </Link>
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-primary-400 hover:text-primary-500"
                            aria-label="Fermer le menu"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                className="h-5 w-5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col gap-4">
                        {navigationLinks.map((link) => (
                            <button
                                key={link.to}
                                type="button"
                                className="text-left text-base font-semibold uppercase tracking-wide text-gray-700 transition hover:text-primary-500"
                                onClick={() => handleNavigate(link.to)}
                            >
                                {link.label}
                            </button>
                        ))}
                        {isAuthenticated && (
                            <button
                                type="button"
                                className="text-left text-base font-semibold uppercase tracking-wide text-primary-500 transition hover:text-primary-600"
                                onClick={() => handleNavigate('/account')}
                            >
                                Mon compte
                            </button>
                        )}
                    </nav>

                    <div className="mt-auto flex flex-col gap-3">
                        {isAuthenticated ? (
                            <>
                                <Button variant="primary" type="button" className="w-full" onClick={handleAccount}>
                                    Mon compte
                                </Button>
                                <Button variant="danger" type="button" className="w-full" onClick={handleLogout}>
                                    Se déconnecter
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="primary" type="button" className="w-full" onClick={handleLogin}>
                                    Se connecter
                                </Button>
                                <Button variant="outline" type="button" className="w-full" onClick={handleRegister}>
                                    Créer un compte
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
