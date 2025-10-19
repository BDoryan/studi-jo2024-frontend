import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { AdminApi } from '@/lib/api';
import {
    clearAdminAuthToken,
    clearStoredAdminUser,
    getAdminAuthToken,
    getStoredAdminUser,
    setAdminAuthToken,
    setStoredAdminUser,
} from '@/lib/api/tokenStorage';

interface AdminAuthContextValue {
    token: string | null;
    user: { email: string; full_name: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: { token: string; email: string; full_name?: string }) => Promise<void>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => getAdminAuthToken());
    const [user, setUser] = useState(() => getStoredAdminUser());
    const [isLoading, setIsLoading] = useState(true);

    const persistToken = useCallback((nextToken: string | null) => {
        if (nextToken) {
            setAdminAuthToken(nextToken);
            setToken(nextToken);
        } else {
            clearAdminAuthToken();
            setToken(null);
        }
    }, []);

    const persistUser = useCallback((nextUser: any | null) => {
        if (nextUser) setStoredAdminUser(nextUser);
        else clearStoredAdminUser();
    }, []);

    const logout = useCallback(() => {
        persistToken(null);
        persistUser(null);
        setUser(null);
    }, [persistToken, persistUser]);

    const login = useCallback(
        async (payload: { token: string; email: string; full_name?: string }) => {
            persistToken(payload.token);
            const newUser = { email: payload.email, full_name: payload.full_name ?? payload.email };
            persistUser(newUser);
            setUser(newUser);
        },
        [persistToken, persistUser],
    );

    // Vérification du token au démarrage
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const api = new AdminApi(() => token);
                const me = await api.getCurrentAdmin(); // → GET /auth/admin/me
                setUser(me);
                persistUser(me);
            } catch {
                // Token expiré / invalide
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        void checkAuth();
    }, [token]);

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: !!token && !!user,
            isLoading,
            login,
            logout,
        }),
        [token, user, isLoading, login, logout],
    );

    // @ts-ignore
    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
    return ctx;
};
