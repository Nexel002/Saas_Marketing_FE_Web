/**
 * Business API Service
 * 
 * Handles all business-related API calls.
 */

import api, { ApiResponse } from './client';

// =============================================
// Types
// =============================================

export interface Business {
    _id: string;
    owner_id: string;
    name: string;
    business_type: BusinessType;
    description?: string;
    slogan?: string;
    country: string;
    city: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_url?: string;
    preferred_channels?: string[];
    brand_tone?: BrandTone;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type BusinessType =
    | 'BAKERY'
    | 'RESTAURANT'
    | 'SALON'
    | 'GROCERY'
    | 'CLINIC'
    | 'SCHOOL'
    | 'TECHNOLOGY'
    | 'SERVICES'
    | 'RETAIL'
    | 'CONSULTING'
    | 'OTHER';

export type BrandTone =
    | 'PROFESSIONAL'
    | 'FRIENDLY'
    | 'HUMOROUS'
    | 'MODERN'
    | 'ELEGANT'
    | 'CASUAL';

export interface CreateBusinessData {
    name: string;
    business_type: BusinessType;
    description?: string;
    city: string;
    country: string;
    slogan?: string;
    phone?: string;
    email?: string;
    website?: string;
    brand_tone?: BrandTone;
    preferred_channels?: string[];
}

export interface UpdateBusinessData extends Partial<CreateBusinessData> { }

// =============================================
// Business Service
// =============================================

export const businessService = {
    /**
     * Get all businesses (paginated)
     */
    async getAll(page = 1, limit = 10): Promise<ApiResponse<Business[]>> {
        return api.get('/business', { params: { page, limit } });
    },

    /**
     * Get business by ID
     */
    async getById(id: string): Promise<ApiResponse<Business>> {
        return api.get(`/business/${id}`);
    },

    /**
     * Create new business
     */
    async create(data: CreateBusinessData): Promise<ApiResponse<Business>> {
        return api.post('/business/create', data);
    },

    /**
     * Create business from AI-parsed description
     */
    async createFromDescription(description: string): Promise<ApiResponse<Business>> {
        return api.post('/business/parse', { description });
    },

    /**
     * Update business
     */
    async update(id: string, data: UpdateBusinessData): Promise<ApiResponse<Business>> {
        return api.patch(`/business/update/${id}`, data);
    },

    /**
     * Delete business
     */
    async delete(id: string): Promise<ApiResponse<void>> {
        return api.delete(`/business/delete/${id}`);
    },
};

export default businessService;
