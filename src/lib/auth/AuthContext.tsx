import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {ApiClient, ApiRoutes} from '@/lib/api';
import {
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from '@/lib/api/tokenStorage';

interface User {
    id: string | number | null;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
}

interface SessionResponse {
    id?: string | number;
    email?: string;
    fullName?: string;
    firstname?: string;
    lastname?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
}

interface AuthContextValue {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [token, setToken] = useState<string | null>(() => getAuthToken());
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const apiClient = useMemo(() => new ApiClient(), []);

    const persistToken = useCallback((nextToken: string | null) => {
        if (nextToken && nextToken.trim().length > 0) {
            setAuthToken(nextToken);
            setToken(nextToken);
        } else {
            clearAuthToken();
            setToken(null);
            setUser(null);
        }
    }, []);

    const fetchUser = useCallback(
        async (authToken: string | null): Promise<boolean> => {
            if (!authToken || authToken.trim().length === 0) {
                setUser(null);
                return false;
            }

            const bearerToken = authToken.startsWith('Bearer ')
                ? authToken
                : `Bearer ${authToken}`;

            try {
                const data = await apiClient.request<SessionResponse>(ApiRoutes.CUSTOMERS_ME, {
                    method: 'GET',
                    headers: {
                        Authorization: bearerToken,
                    },
                });

                if (!data) {
                    persistToken(null);
                    return false;
                }

                const rawFirstName =
                    (typeof data.firstname === 'string' && data.firstname.trim().length > 0
                        ? data.firstname
                        : undefined) ??
                    (typeof data.first_name === 'string' && data.first_name.trim().length > 0
                        ? data.first_name
                        : undefined);

                const rawLastName =
                    (typeof data.lastname === 'string' && data.lastname.trim().length > 0
                        ? data.lastname
                        : undefined) ??
                    (typeof data.last_name === 'string' && data.last_name.trim().length > 0
                        ? data.last_name
                        : undefined);

                const normalisedFirstName = rawFirstName ?? '';
                const normalisedLastName = rawLastName ?? '';
                const email = typeof data.email === 'string' ? data.email : '';

                const fullNameFromResponse =
                    (typeof data.fullName === 'string' && data.fullName.trim().length > 0
                        ? data.fullName
                        : '') ||
                    `${normalisedFirstName} ${normalisedLastName}`.trim();

                const resolvedRole =
                    typeof data.role === 'string' && data.role.trim().length > 0
                        ? data.role
                        : 'customer';

                const resolvedId =
                    typeof data.id === 'number' || typeof data.id === 'string' ? data.id : null;

                setUser({
                    id: resolvedId,
                    email,
                    firstName: normalisedFirstName,
                    lastName: normalisedLastName,
                    fullName: fullNameFromResponse || email,
                    role: resolvedRole,
                });

                return true;
            } catch (error) {
                console.error('Failed to fetch session information.', error);
                persistToken(null);
                return false;
            }
        },
        [apiClient, persistToken],
    );

    const handleLogin = useCallback(
        async (nextToken: string) => {
            persistToken(nextToken);
            const success = await fetchUser(nextToken);

            if (!success) {
                throw new Error('La récupération du profil a échoué.');
            }
        },
        [persistToken, fetchUser],
    );

    const handleLogout = useCallback(() => {
        persistToken(null);
    }, [persistToken]);

    // Vérifie le token au démarrage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getAuthToken();
            if (storedToken) {
                await fetchUser(storedToken);
            }
            setIsLoading(false);
        };
        initAuth();
    }, [fetchUser]);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token && user),
            isLoading,
            login: handleLogin,
            logout: handleLogout,
        }),
        [token, user, isLoading, handleLogin, handleLogout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
