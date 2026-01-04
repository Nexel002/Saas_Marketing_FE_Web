/**
 * Strategic Plan API Service
 * 
 * Endpoints:
 * - GET /api/v1/strategic-plan - Listar planos (user from token)
 * - GET /api/v1/strategic-plan/:id - Obter plano
 * - POST /api/v1/strategic-plan/generate - Gerar plano (user from token)
 * - DELETE /api/v1/strategic-plan/:id - Eliminar plano
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export interface StrategicPlan {
    _id: string;
    user_id: string;
    business_id?: string;
    pdf_url?: string;
    drive_link?: string;
    content?: {
        mission?: string;
        vision?: string;
        values?: string[];
        valueProposition?: string;
        brandTone?: string;
        colorPalette?: string[];
    };
    // Direct fields (alternative API format)
    mission?: string;
    vision?: string;
    values?: string[];
    valueProposition?: string;
    brandTone?: string;
    colorPalette?: string[];
    created_at: string;
}

export interface GenerateStrategicPlanData {
    marketResearchSummary?: string;
}

// =============================================
// Strategic Plan Service
// =============================================

export const strategicPlanService = {
    /**
     * List strategic plans for authenticated user
     * GET /api/v1/strategic-plan
     * Note: Backend extracts userId from JWT token
     */
    async list(): Promise<ApiResponse<StrategicPlan[]>> {
        return api.get<StrategicPlan[]>('/v1/strategic-plan');
    },

    /**
     * Get plan by ID
     * GET /api/v1/strategic-plan/:id
     */
    async getById(planId: string): Promise<ApiResponse<StrategicPlan>> {
        return api.get<StrategicPlan>(`/v1/strategic-plan/${planId}`);
    },

    /**
     * Generate strategic plan
     * POST /api/v1/strategic-plan/generate
     * Note: Backend extracts userId from JWT token
     */
    async generate(data?: GenerateStrategicPlanData): Promise<ApiResponse<StrategicPlan>> {
        return api.post<StrategicPlan>('/v1/strategic-plan/generate', data || {});
    },

    /**
     * Delete plan
     * DELETE /api/v1/strategic-plan/:id
     */
    async delete(planId: string): Promise<ApiResponse<void>> {
        return api.delete<void>(`/v1/strategic-plan/${planId}`);
    },
};

export default strategicPlanService;
