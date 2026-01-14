/**
 * API Services - Barrel Export
 * 
 * Central export for all API services.
 */

// Core
export { api, getToken, setToken, removeToken } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

// Auth
export { authService } from './auth';
export type { LoginCredentials, RegisterData, User, AuthResponse } from './auth';

// Business
export { businessService } from './business';
export type { Business, BusinessProfile, BusinessType, BrandTone, CreateBusinessData, UpdateBusinessData } from './business';

// Dashboard
export { dashboardService } from './dashboard';
export type { DashboardSummary, Activity, CampaignStats } from './dashboard';

// Chat
export { chatService } from './chat';
export type { Conversation, ChatMessage, ConversationSummary, SSEEvent, ToolCall } from './chat';

// Campaign
export { campaignService } from './campaign';
export type { Campaign, CampaignPlan, CampaignObjective, GenerateCampaignData, CampaignObjectiveInfo } from './campaign';

// Research
export { researchService } from './research';
export type { MarketResearch } from './research';

// Strategic Plan
export { strategicPlanService } from './strategic';
export type { StrategicPlan, GenerateStrategicPlanData } from './strategic';

// Content
export { contentService } from './content';
export type { ContentItem, ContentType, ContentStatus, MediaContentItem } from './content';

// Documents
export { documentsService } from './documents';
export type { Document, DocumentType } from '@/types/document';

// Assets
export { assetsService } from './assets';
export type { AssetType, UploadedAsset, AssetListItem, GalleryItem, UploadResponse } from './assets';
