'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, getToken, removeToken } from '@/lib/api';

/**
 * Auth Context
 * 
 * Manages user authentication state throughout the application.
 * Provides login, logout, and session persistence.
 */

// =============================================
// Types
// =============================================

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (nome: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// =============================================
// Context
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================
// Provider Component
// =============================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();

            if (token) {
                try {
                    // Token exists, try to get user info
                    // For now, we'll store user in localStorage too
                    const storedUser = localStorage.getItem('promomo_user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    // Token is invalid, clear it
                    removeToken();
                    localStorage.removeItem('promomo_user');
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Login handler
    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        setUser(response.user);
        localStorage.setItem('promomo_user', JSON.stringify(response.user));
    };

    // Register handler
    const register = async (nome: string, email: string, password: string) => {
        const response = await authService.register({ nome, email, password });
        setUser(response.user);
        localStorage.setItem('promomo_user', JSON.stringify(response.user));
    };

    // Logout handler
    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            setUser(null);
            localStorage.removeItem('promomo_user');
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =============================================
// Hook
// =============================================

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export default AuthContext;
