/**
 * Document Types
 * 
 * Type definitions for document viewer feature
 */

export type DocumentType = 'market_research' | 'strategic_plan' | 'campaign' | 'pdf_document';

export interface Document {
    id: string;
    type: DocumentType;
    title: string;
    content: string;  // Markdown content
    driveLink?: string;
    pdfFileName?: string;
    createdAt: Date;
}

export interface DocumentPanelState {
    isOpen: boolean;
    document?: Document;
    isLoading?: boolean;
}

export interface DocumentEventData {
    type: DocumentType;
    title: string;
    content: string;
    driveLink?: string;
    pdfFileName?: string;
    documentId: string;
}
