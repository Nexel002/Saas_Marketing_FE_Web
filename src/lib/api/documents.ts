/**
 * Documents API Service
 * 
 * Handles document retrieval and management
 */

import api, { ApiResponse } from './client';
import { Document, DocumentType } from '@/types/document';

export const documentsService = {
    /**
     * List all documents for current business
     * GET /api/v1/documents
     */
    async list(): Promise<ApiResponse<Document[]>> {
        return api.get<Document[]>('/documents');
    },

    /**
     * Get specific document with full markdown content
     * GET /api/v1/documents/:type/:id
     */
    async get(type: DocumentType, id: string): Promise<ApiResponse<Document>> {
        return api.get<Document>(`/documents/${type}/${id}`);
    }
};

export default documentsService;
