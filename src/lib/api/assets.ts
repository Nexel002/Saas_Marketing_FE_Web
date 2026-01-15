/**
 * Assets API Service
 * 
 * Handles file uploads and asset management.
 * Endpoints:
 * - POST /api/v1/product-assets/:businessId - Upload asset
 * - POST /api/v1/product-assets/logo/:businessId - Upload logo
 * - GET /api/v1/product-assets/:businessId/uploads - List uploads
 * - GET /api/v1/product-assets/:businessId/gallery - Get gallery
 * - DELETE /api/v1/product-assets/:businessId/upload/:assetId - Soft delete
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export type AssetType = 'product' | 'logo' | 'background' | 'service' | 'other';

export interface UploadedAsset {
    assetId: string;
    fileName: string;
    fileType: AssetType;
    driveWebLink?: string;
    localPath?: string;
    message: string;
}

export interface AssetListItem {
    assetId: string;
    fileName: string;
    fileType: AssetType;
    driveWebLink?: string;
    uploadedAt: string;
    isDeleted: boolean;
}

export interface GalleryItem {
    id: string;
    name: string;
    type: string;
    url: string;
    mimeType: string;
    uploadedAt: string;
}

export interface UploadResponse {
    success: boolean;
    assetId?: string;
    fileName?: string;
    fileType?: AssetType;
    driveWebLink?: string;
    localPath?: string;
    message: string;
}

// =============================================
// Assets Service
// =============================================

export const assetsService = {
    /**
     * Upload a generic asset (product image, background, etc.)
     * POST /api/v1/product-assets/:businessId
     */
    async uploadAsset(
        businessId: string,
        file: File,
        assetType: AssetType = 'product',
        description?: string,
        tags?: string[]
    ): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assetType', assetType);
        if (description) formData.append('description', description);
        if (tags && tags.length > 0) formData.append('tags', tags.join(','));

        return api.postFormData<UploadResponse>(`/product-assets/${businessId}`, formData);
    },

    /**
     * Upload a logo for the business
     * POST /api/v1/product-assets/logo/:businessId
     */
    async uploadLogo(
        businessId: string,
        file: File,
        confirmOverwrite: boolean = false,
        extractVisualIdentity: boolean = true
    ): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('confirmOverwrite', confirmOverwrite.toString());
        formData.append('extractVisualIdentity', extractVisualIdentity.toString());

        return api.postFormData<UploadResponse>(`/product-assets/logo/${businessId}`, formData);
    },

    /**
     * Check if business has a logo
     * GET /api/v1/product-assets/logo/:businessId/check
     */
    async checkLogoExists(businessId: string): Promise<ApiResponse<{
        hasLogo: boolean;
        logoUrl?: string;
        assetId?: string;
        message: string;
    }>> {
        return api.get(`/product-assets/logo/${businessId}/check`);
    },

    /**
     * List all uploads for a business
     * GET /api/v1/product-assets/:businessId/uploads
     */
    async getUploads(
        businessId: string,
        includeDeleted: boolean = false
    ): Promise<ApiResponse<{ count: number; uploads: AssetListItem[] }>> {
        return api.get(`/product-assets/${businessId}/uploads`, {
            params: { includeDeleted: includeDeleted.toString() }
        });
    },

    /**
     * Get asset gallery for a business
     * GET /api/v1/product-assets/:businessId/gallery
     */
    async getGallery(businessId: string): Promise<ApiResponse<{
        assets: GalleryItem[];
        total: number;
    }>> {
        return api.get(`/product-assets/${businessId}/gallery`);
    },

    /**
     * Get upload links for rendering
     * GET /api/v1/product-assets/:businessId/links
     */
    async getUploadLinks(
        businessId: string,
        type?: AssetType
    ): Promise<ApiResponse<{ links: string[]; count: number }>> {
        const params: Record<string, string> = {};
        if (type) params.type = type;
        return api.get(`/product-assets/${businessId}/links`, { params });
    },

    /**
     * Soft delete an upload
     * DELETE /api/v1/product-assets/:businessId/upload/:assetId
     */
    async deleteUpload(
        businessId: string,
        assetId: string
    ): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return api.delete(`/product-assets/${businessId}/upload/${assetId}`);
    }
};

export default assetsService;
