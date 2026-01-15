/**
 * API Client Configuration
 * 
 * Centralized HTTP client for all API calls.
 * Uses fetch with interceptors for authentication.
 */

// =============================================
// Configuration
// =============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// =============================================
// Types
// =============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

// =============================================
// Token Management
// =============================================

const TOKEN_KEY = 'promomo_token';

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
};

// =============================================
// API Client Class
// =============================================

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Build URL with query parameters
     */
    private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Get default headers
     */
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle response
     */
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const data = await response.json();

        if (!response.ok) {
            // Handle 401 Unauthorized - redirect to login
            if (response.status === 401) {
                removeToken();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }

            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * POST request with FormData (for file uploads)
     * Does not set Content-Type header - browser sets it automatically with correct boundary
     */
    async postFormData<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options?.params);

        const headers: HeadersInit = {};
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
            ...options,
        });

        return this.handleResponse<T>(response);
    }
}

// =============================================
// Export singleton instance
// =============================================

export const api = new ApiClient(API_BASE_URL);

export default api;
