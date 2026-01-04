/**
 * Dashboard API Service
 * 
 * Endpoints:
 * - GET /api/v1/dashboard/summary - Resumo do dashboard
 * - GET /api/v1/dashboard/activity - Actividades recentes
 * - GET /api/v1/dashboard/campaigns/stats - Stats campanhas
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export interface DashboardSummary {
    user: {
        id: string;
        nome: string;
        email: string;
    };
    business?: {
        id: string;
        name: string;
        business_type: string;
    };
    stats: {
        totalCampaigns: number;
        totalConversations: number;
        hasMarketResearch: boolean;
        hasStrategicPlan: boolean;
    };
    marketResearch?: {
        id: string;
        generatedAt: string;
    };
    strategicPlan?: {
        id: string;
        generatedAt: string;
    };
    recentCampaigns: {
        id: string;
        name: string;
        objective: string;
        generatedAt: string;
    }[];
    hasBusiness: boolean;
}

export interface Activity {
    id: string;
    type: 'campaign' | 'research' | 'plan' | 'conversation';
    title: string;
    description: string;
    timestamp: string;
}

export interface CampaignStats {
    objective: string;
    count: number;
}

// =============================================
// Dashboard Service
// =============================================

export const dashboardService = {
    /**
     * Get dashboard summary
     * GET /api/v1/dashboard/summary
     */
    async getSummary(): Promise<ApiResponse<DashboardSummary>> {
        return api.get<DashboardSummary>('/v1/dashboard/summary');
    },

    /**
     * Get recent activity
     * GET /api/v1/dashboard/activity
     */
    async getActivity(limit = 20): Promise<ApiResponse<Activity[]>> {
        return api.get<Activity[]>(`/v1/dashboard/activity?limit=${limit}`);
    },

    /**
     * Get campaign stats
     * GET /api/v1/dashboard/campaigns/stats
     */
    async getCampaignStats(): Promise<ApiResponse<CampaignStats[]>> {
        return api.get<CampaignStats[]>('/v1/dashboard/campaigns/stats');
    },
};

export default dashboardService;
