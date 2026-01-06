/**
 * Content API Service
 * 
 * Endpoints:
 * - GET /api/business/:businessId/contents - Get all contents for a business
 */

import { api, ApiResponse } from './client';

// =============================================
// Types
// =============================================

export type ContentType = 'IMAGE' | 'VIDEO';
export type ContentStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

/**
 * Content item with campaign metadata
 * Extends MediaItem structure used in MediaCarousel
 */
export interface ContentItem {
    id: string;
    name: string;
    type: ContentType;
    status: ContentStatus;
    campaignName: string;
    campaignId?: string;
    generatedAt?: string;
    driveLink?: string;
    // Carousel info
    isCarousel?: boolean;
    carouselSlides?: number;
    carouselDriveLinks?: string[];
}

/**
 * Converted MediaItem format for use in UI components
 */
export interface MediaContentItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    thumbnail?: string;
    campaignName?: string;
    campaignId?: string;
}

// =============================================
// Utility Functions
// =============================================

/**
 * Convert Google Drive link to direct view URL
 * Handles various Drive URL formats and extracts file ID
 * 
 * @param driveLink - Google Drive link (e.g., https://drive.google.com/file/d/FILE_ID/view)
 * @param type - Content type (IMAGE or VIDEO)
 * @returns Direct view URL for embedding
 */
function convertDriveLinkToDirectUrl(driveLink: string, type: ContentType): string {
    if (!driveLink) return '';

    // Extract file ID from various Google Drive URL formats
    let fileId = '';

    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    const match1 = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) {
        fileId = match1[1];
    }

    // Format 2: https://drive.google.com/open?id=FILE_ID
    const match2 = driveLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) {
        fileId = match2[1];
    }

    // Format 3: Already a direct link or file ID only
    if (!fileId && driveLink.length > 20 && !driveLink.includes('/')) {
        fileId = driveLink;
    }

    if (!fileId) {
        console.warn('Could not extract file ID from Drive link:', driveLink);
        return driveLink; // Return original if we can't parse it
    }

    // Convert to direct view URL based on type
    if (type === 'IMAGE') {
        // For images: use uc?export=view for direct image display
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    } else {
        // For videos: use preview embed for proper video player
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
}

// =============================================
// Content Service
// =============================================

export const contentService = {
    /**
     * Get all contents for a specific business
     * GET /api/business/:businessId/contents
     */
    async getAllBusinessContents(businessId: string): Promise<ApiResponse<ContentItem[]>> {
        return api.get<ContentItem[]>(`/business/${businessId}/contents`);
    },

    /**
     * Convert ContentItem to MediaItem format for UI components
     * Handles Google Drive link conversion and carousel content
     */
    convertToMediaItems(contents: ContentItem[]): MediaContentItem[] {
        const mediaItems: MediaContentItem[] = [];

        contents
            .filter(c => c.status === 'COMPLETED' && c.driveLink)
            .forEach(content => {
                // Handle carousel content (multiple slides)
                if (content.isCarousel && content.carouselDriveLinks && content.carouselDriveLinks.length > 0) {
                    // Add each carousel slide as a separate media item
                    content.carouselDriveLinks.forEach((link, index) => {
                        mediaItems.push({
                            id: `${content.id}-slide-${index}`,
                            type: content.type === 'IMAGE' ? 'image' as const : 'video' as const,
                            url: convertDriveLinkToDirectUrl(link, content.type),
                            title: `${content.name} (${index + 1}/${content.carouselDriveLinks!.length})`,
                            campaignName: content.campaignName,
                            campaignId: content.campaignId,
                        });
                    });
                } else {
                    // Single content item
                    mediaItems.push({
                        id: content.id,
                        type: content.type === 'IMAGE' ? 'image' as const : 'video' as const,
                        url: convertDriveLinkToDirectUrl(content.driveLink!, content.type),
                        title: content.name,
                        thumbnail: content.type === 'VIDEO'
                            ? convertDriveLinkToDirectUrl(content.driveLink!, 'IMAGE')
                            : undefined,
                        campaignName: content.campaignName,
                        campaignId: content.campaignId,
                    });
                }
            });

        return mediaItems;
    },

    /**
     * Get unique campaign names from contents
     */
    getUniqueCampaigns(contents: ContentItem[]): Array<{ name: string; count: number }> {
        const campaignMap = new Map<string, number>();

        contents.forEach(content => {
            const current = campaignMap.get(content.campaignName) || 0;
            campaignMap.set(content.campaignName, current + 1);
        });

        return Array.from(campaignMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
};

export default contentService;
