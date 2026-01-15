/**
 * Research API Service
 * 
 * Endpoints:
 * - GET /api/v1/research - Listar pesquisas (user from token)
 * - GET /api/v1/research/:id - Obter pesquisa
 * - POST /api/v1/research/business - Gerar pesquisa (user from token)
 * - DELETE /api/v1/research/:id - Eliminar pesquisa
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export interface MarketResearch {
    _id: string;
    user_id: string;
    business_id?: string;
    pdf_url?: string;
    drive_link?: string;
    summary?: string;
    content?: string;
    created_at: string;
}

// =============================================
// Research Service
// =============================================

export const researchService = {
    /**
     * List market research for authenticated user
     * GET /api/v1/research
     * @param userId - User ID (required by backend)
     */
    async list(userId?: string): Promise<ApiResponse<MarketResearch[]>> {
        const params = userId ? `?userId=${userId}` : '';
        return api.get<MarketResearch[]>(`/research${params}`);
    },

    /**
     * Get research by ID
     * GET /api/v1/research/:id
     */
    async getById(researchId: string): Promise<ApiResponse<MarketResearch>> {
        return api.get<MarketResearch>(`/research/${researchId}`);
    },

    /**
     * Generate market research for business
     * POST /api/v1/research/business
     * Note: Backend extracts userId from JWT token
     */
    async generate(): Promise<ApiResponse<MarketResearch>> {
        return api.post<MarketResearch>('/research/business', {});
    },

    /**
     * Delete research
     * DELETE /api/v1/research/:id
     */
    async delete(researchId: string): Promise<ApiResponse<void>> {
        return api.delete<void>(`/research/${researchId}`);
    },
};

export default researchService;
