'use client';

import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { Document } from '@/types/document';
import { sanitizeContent } from '@/lib/chatHelpers';

// Lazy load heavy components
const MediaCarousel = dynamic(() => import('@/components/ui/MediaCarousel'), {
    ssr: false,
    loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
});

const ContentGalleryModal = dynamic(() => import('@/components/ui/ContentGalleryModal'), {
    ssr: false
});

// =============================================
// Types
// =============================================

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    thumbnail?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: string[];
    toolResultData?: any[];
    documents?: Document[];
    uploadedImages?: Array<{ url: string; name: string; driveLink?: string }>;
    timestamp: Date;
}

interface MessageBubbleProps {
    message: Message;
    userInitial?: string;
    onViewDocument?: (doc: Document) => void;
}

// =============================================
// Helper Functions
// =============================================

// Convert Google Drive viewer links to direct links
const formatUrlForDisplay = (url: string): string => {
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return url;
};

// Extract media items from content
const extractMedia = (content: string, toolResults?: any[]): { cleanContent: string; mediaItems: MediaItem[] } => {
    const mediaItems: MediaItem[] = [];
    const seenIds = new Set<string>();

    // 1. Extract from Tool Results (Source of Truth)
    if (toolResults) {
        toolResults.forEach(result => {
            let data = result;
            if (typeof result === 'string') {
                try {
                    data = JSON.parse(result);
                } catch (e) {
                    // ignore
                }
            }

            const contents = data.contents || (data.result && data.result.contents) || data.images || data.videos;

            if (Array.isArray(contents)) {
                contents.forEach((item: any) => {
                    const originalUrl = item.driveLink || item.drive_web_link || item.url;

                    if (originalUrl) {
                        const displayUrl = formatUrlForDisplay(originalUrl);

                        if (!seenIds.has(originalUrl)) {
                            seenIds.add(originalUrl);

                            const itemType = (item.type || item.content_type || '').toLowerCase();
                            const isVideo = itemType === 'video' || itemType.includes('video') || itemType === 'mp4';

                            mediaItems.push({
                                id: originalUrl,
                                type: isVideo ? 'video' : 'image',
                                url: displayUrl,
                                title: item.title || item.name || item.content_name || 'Conteúdo Gerado',
                                thumbnail: item.thumbnail
                            });
                        }
                    }
                });
            }
        });
    }

    // 2. Extract from Markdown Text (Fallback & User pasted links)
    if (!content) return { cleanContent: '', mediaItems };

    const lines = content.split('\n');
    const remainingLines: string[] = [];

    // Regex to match markdown image ![alt](url) or link [text](url)
    const markdownLinkRegex = /(!)?]\[(.*?)\]\((https?:\/\/[^)]+)\)/i;

    lines.forEach(line => {
        const mediaMatch = line.match(markdownLinkRegex);

        let isMedia = false;

        if (mediaMatch) {
            const isMarkdownImage = !!mediaMatch[1];
            const text = mediaMatch[2];
            const originalUrl = mediaMatch[3];

            const lowerText = text.toLowerCase();
            const isVideo = lowerText.includes('vídeo') || lowerText.includes('video') || lowerText.includes('assistir');
            const isImageKeyword = lowerText.includes('imagem') || lowerText.includes('image') || lowerText.includes('foto') || lowerText.includes('ver');

            if (isMarkdownImage || isVideo || isImageKeyword) {
                if (!seenIds.has(originalUrl)) {
                    isMedia = true;
                    seenIds.add(originalUrl);

                    const type = isVideo ? 'video' : 'image';
                    let title = line.replace(mediaMatch[0], '').trim();
                    title = title.replace(/^[*-]\s*/, '').replace(/:\s*$/, '').trim();

                    if (!title) title = (text !== 'Ver Imagem' && text !== 'Ver Vídeo') ? text : (type === 'video' ? 'Vídeo gerado' : 'Imagem gerada');

                    const displayUrl = formatUrlForDisplay(originalUrl);

                    mediaItems.push({
                        id: originalUrl,
                        type: type as 'image' | 'video',
                        url: displayUrl,
                        title: title
                    });
                } else {
                    isMedia = true;
                }
            }
        }

        if (!isMedia) {
            remainingLines.push(line);
        }
    });

    return {
        cleanContent: remainingLines.join('\n'),
        mediaItems
    };
};

// Extract documents from tool results for display
const extractDocuments = (toolResults?: any[]): Document[] => {
    const docs: Document[] = [];
    const seenIds = new Set<string>();

    if (toolResults) {
        toolResults.forEach(result => {
            let data = result;
            if (typeof result === 'string') {
                try { data = JSON.parse(result); } catch (e) { }
            }

            const items = Array.isArray(data) ? data :
                (data.documents || data.campaigns || (data.campaign_name ? [data] : []));

            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    const id = item.id || item._id;
                    const driveLink = item.driveLink || item.drive_link;

                    if (id && (driveLink || item.campaign_name || item.title)) {
                        let type = item.type;
                        if (!type) {
                            if (item.campaign_name) type = 'campaign';
                            else if (item.title?.toLowerCase().includes('pesquisa')) type = 'market_research';
                            else if (item.title?.toLowerCase().includes('plano')) type = 'strategic_plan';
                        }

                        if (type && !seenIds.has(id)) {
                            seenIds.add(id);
                            docs.push({
                                id,
                                type: type,
                                title: item.title || item.campaign_name || 'Documento',
                                content: item.content || item.description || '',
                                driveLink: driveLink,
                                pdfFileName: item.pdfFileName || item.pdf_file_name,
                                createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
                            });
                        }
                    }
                });
            }
        });
    }
    return docs;
};

// =============================================
// Component
// =============================================

function MessageBubbleComponent({ message, userInitial, onViewDocument }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const [galleryOpen, setGalleryOpen] = useState(false);

    const { cleanContent, mediaItems } = extractMedia(message.content, message.toolResultData);
    const extractedDocuments = extractDocuments(message.toolResultData);

    // Combine explicit message documents with extracted ones, avoiding duplicates
    const allDocuments = [...(message.documents || [])];
    extractedDocuments.forEach((doc: Document) => {
        if (!allDocuments.some(d => d.id === doc.id)) {
            allDocuments.push(doc);
        }
    });

    // Sanitize content to remove technical IDs
    const sanitizedContent = sanitizeContent(cleanContent);

    // Build a map of Drive Links -> Document Info from tool results
    const linkMap = new Map<string, { id: string; type: any; title: string }>();

    if (message.toolResultData) {
        message.toolResultData.forEach(result => {
            let data = result;
            if (typeof result === 'string') {
                try { data = JSON.parse(result); } catch (e) { }
            }

            const items = Array.isArray(data) ? data :
                (data.documents || data.campaigns || data.contents || []);

            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    const link = item.driveLink || item.drive_link;
                    const id = item.id || item._id;
                    const type = item.type || (item.campaign_name ? 'campaign' : undefined);

                    if (link && id && type) {
                        linkMap.set(link, { id, type, title: item.title || item.campaign_name || 'Documento' });
                    }
                });
            }
        });
    }

    // User message
    if (isUser) {
        const getDisplayUrl = (url: string): string => {
            const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch && driveMatch[1]) {
                return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
            }
            return url;
        };

        return (
            <div className="flex flex-col items-end mb-6 gap-2">
                {/* Uploaded Images */}
                {message.uploadedImages && message.uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-[85%] sm:max-w-[75%] justify-end">
                        {message.uploadedImages.map((img, idx) => (
                            <a
                                key={idx}
                                href={img.driveLink || img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors shadow-md"
                                title={`Ver: ${img.name}`}
                            >
                                <img
                                    src={getDisplayUrl(img.url)}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zm0 2v10h16V7H4zm2 2h2v2H6V9zm4 0h8v2h-8V9zm-4 4h12v2H6v-2z"/></svg>';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">Ver imagem</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Text content */}
                <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{sanitizedContent}</p>
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                {/* Message Content */}
                <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-7 text-[15px]">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="font-medium text-gray-700">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-5 my-3 space-y-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-5 my-3 space-y-2">{children}</ol>,
                            li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold text-gray-900 mt-3 mb-2">{children}</h3>,
                            a: ({ href, children }) => {
                                if (!href) return <span>{children}</span>;

                                const mappedDoc = linkMap.get(href);
                                if (mappedDoc && onViewDocument) {
                                    return (
                                        <button
                                            onClick={() => onViewDocument({
                                                id: mappedDoc.id,
                                                type: mappedDoc.type,
                                                title: mappedDoc.title,
                                                content: '',
                                                driveLink: href,
                                                createdAt: new Date()
                                            })}
                                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors text-left inline-block"
                                            title="Ver documento"
                                        >
                                            {children}
                                        </button>
                                    );
                                }

                                const isPdf = href?.toLowerCase().includes('.pdf') ||
                                    href?.includes('drive.google.com') ||
                                    href?.includes('docs.google.com');

                                if (isPdf && onViewDocument) {
                                    return (
                                        <button
                                            onClick={() => onViewDocument({
                                                id: href,
                                                type: 'pdf_document',
                                                title: String(children),
                                                content: '',
                                                driveLink: href,
                                                createdAt: new Date()
                                            })}
                                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors text-left inline-block"
                                            title="Ver documento"
                                        >
                                            {children}
                                        </button>
                                    );
                                }

                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                        {children}
                                    </a>
                                );
                            },
                            code: ({ children }) => (
                                <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                            ),
                            pre: ({ children }) => (
                                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm my-3">{children}</pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic text-gray-600 my-3 bg-gray-50/50 rounded-r">{children}</blockquote>
                            ),
                            hr: () => <hr className="my-4 border-gray-200" />,
                        }}
                    >
                        {sanitizedContent || '...'}
                    </ReactMarkdown>
                </div>

                {/* Media Carousel */}
                {mediaItems.length > 0 && (
                    <div className="mt-4">
                        <MediaCarousel
                            items={mediaItems}
                            onViewAll={() => setGalleryOpen(true)}
                        />
                        <ContentGalleryModal
                            isOpen={galleryOpen}
                            onClose={() => setGalleryOpen(false)}
                            items={mediaItems}
                        />
                    </div>
                )}

                {/* Generated Documents (PDFs) */}
                {allDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {allDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl max-w-sm">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                                    <p className="text-xs text-gray-500">Documento PDF</p>
                                </div>
                                <button
                                    onClick={() => onViewDocument?.(doc)}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors shadow-sm"
                                >
                                    Ver PDF
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const MessageBubble = memo(MessageBubbleComponent);
export default MessageBubble;
