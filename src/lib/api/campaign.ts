/**
 * Campaign API Service
 * 
 * Endpoints:
 * - GET /api/v1/campaign - Listar campanhas (user from token)
 * - GET /api/v1/campaign/:id - Obter campanha
 * - POST /api/v1/campaign/generate - Gerar campanha (user from token)
 * - DELETE /api/v1/campaign/:id - Eliminar campanha
 * - GET /api/v1/campaign/objectives - Listar objectivos
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export type CampaignObjective =
    | 'BRAND_AWARENESS'
    | 'LEAD_GENERATION'
    | 'SALES'
    | 'ENGAGEMENT'
    | 'TRAFFIC';

export interface Campaign {
    _id: string;
    user_id: string;
    business_id?: string;
    name: string;
    objective: CampaignObjective;
    start_date?: string;
    end_date?: string;
    plan: CampaignPlan;
    pdf_url?: string;
    created_at: string;
}

export interface CampaignPlan {
    summary: string;
    target_audience: string;
    channels: string[];
    strategies: string[];
    timeline: string;
    budget?: string;
    kpis: string[];
}

export interface GenerateCampaignData {
    objective: CampaignObjective;
    campaignName?: string;
    startDate?: string;
    endDate?: string;
}

export interface CampaignObjectiveInfo {
    value: CampaignObjective;
    label: string;
    description: string;
}

// =============================================
// Campaign Service
// =============================================

export const campaignService = {
    /**
     * List campaigns for authenticated user
     * GET /api/v1/campaign
     * Note: Backend extracts userId from JWT token
     */
    async list(objective?: CampaignObjective): Promise<ApiResponse<Campaign[]>> {
        let url = '/v1/campaign';
        if (objective) url += `?objective=${objective}`;
        return api.get<Campaign[]>(url);
    },

    /**
     * Get campaign by ID
     * GET /api/v1/campaign/:id
     */
    async getById(campaignId: string): Promise<ApiResponse<Campaign>> {
        return api.get<Campaign>(`/v1/campaign/${campaignId}`);
    },

    /**
     * Generate new campaign
     * POST /api/v1/campaign/generate
     * Note: Backend extracts userId from JWT token
     */
    async generate(data: GenerateCampaignData): Promise<ApiResponse<Campaign>> {
        return api.post<Campaign>('/v1/campaign/generate', data);
    },

    /**
     * Delete campaign
     * DELETE /api/v1/campaign/:id
     */
    async delete(campaignId: string): Promise<ApiResponse<void>> {
        return api.delete<void>(`/v1/campaign/${campaignId}`);
    },

    /**
     * List available objectives
     * GET /api/v1/campaign/objectives
     */
    async getObjectives(): Promise<ApiResponse<CampaignObjectiveInfo[]>> {
        return api.get<CampaignObjectiveInfo[]>('/v1/campaign/objectives');
    },

    /**
     * Generate campaign contents (images/videos)
     * POST /api/v1/campaign/:id/generate-contents
     */
    async generateContents(campaignId: string): Promise<ApiResponse<any>> {
        return api.post<any>(`/v1/campaign/${campaignId}/generate-contents`, {});
    },
};

export default campaignService;
