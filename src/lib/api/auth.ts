/**
 * Auth API Service
 * 
 * Handles all authentication-related API calls.
 */

import api, { setToken, removeToken, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    nome: string;
    email: string;
    password: string;
    phone?: string;
    genero?: 'MASCULINO' | 'FEMININO' | 'OUTRO';
    dataNascimento?: string;
}

export interface User {
    _id: string;
    nome: string;
    email: string;
    phone?: string;
    profile_url?: string;
    isActive: boolean;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// =============================================
// Auth Service
// =============================================

export const authService = {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/signin', credentials);

        if (response.success && response.data?.token) {
            setToken(response.data.token);
        }

        return response.data!;
    },

    /**
     * Register new user
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/signup', data);

        if (response.success && response.data?.token) {
            setToken(response.data.token);
        }

        return response.data!;
    },

    /**
     * Logout - remove token and call API
     */
    async logout(): Promise<void> {
        try {
            await api.post('/auth/signout');
        } finally {
            removeToken();
        }
    },

    /**
     * Send verification code
     */
    async sendVerificationCode(): Promise<ApiResponse> {
        return api.post('/auth/send-verification-code');
    },

    /**
     * Verify code
     */
    async verifyCode(code: string): Promise<ApiResponse> {
        return api.post('/auth/verify-verification-code', { providedCode: code });
    },

    /**
     * Send forgot password code
     */
    async sendForgotPasswordCode(email: string): Promise<ApiResponse> {
        return api.post('/auth/send-forgot-password-code', { email });
    },

    /**
     * Reset password with code
     */
    async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
        return api.post('/auth/verify-forgot-password-code', {
            email,
            providedCode: code,
            newPassword,
        });
    },

    /**
     * Change password
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
        return api.patch('/auth/change-password', { oldPassword, newPassword });
    },
};

export default authService;
