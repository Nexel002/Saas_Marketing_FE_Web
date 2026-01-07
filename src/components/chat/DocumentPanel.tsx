'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Download, Share2, X } from 'lucide-react';
import { Document } from '@/types/document';

/**
 * Document Panel Component
 * 
 * Side panel that displays generated documents (Market Research, Strategic Plan, Campaigns)
 * in a ChatGPT Canvas-style interface.
 */

interface DocumentPanelProps {
    isOpen: boolean;
    document?: Document;
    onClose: () => void;
}

export function DocumentPanel({ isOpen, document, onClose }: DocumentPanelProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleViewPDF = () => {
        if (document?.driveLink) {
            window.open(document.driveLink, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownloadPDF = async () => {
        if (!document?.driveLink) return;

        try {
            setIsLoading(true);
            // Extract file ID from Drive link
            const match = document.driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
                const fileId = match[1];
                const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

                // Create temporary link and trigger download
                const link = window.document.createElement('a');
                link.href = downloadUrl;
                link.download = document.pdfFileName || `${document.title}.pdf`;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSharePDF = async () => {
        if (!document?.driveLink) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: document.title,
                    text: `Confira este documento: ${document.title}`,
                    url: document.driveLink
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(document.driveLink);
                // TODO: Show toast notification
                alert('Link copiado para a área de transferência!');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl
                           w-full lg:w-1/2
                           animate-in slide-in-from-right duration-300"
                role="complementary"
                aria-label="Visualizador de documento"
            >
                {/* Header */}
                <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 truncate">
                            {document?.title || 'Documento'}
                        </h2>
                        {document?.pdfFileName && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                {document.pdfFileName}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {document?.driveLink && (
                            <>
                                <button
                                    onClick={handleViewPDF}
                                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
                                    title="Ver PDF no Google Drive"
                                    aria-label="Ver PDF"
                                >
                                    <Eye className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
                                </button>

                                <button
                                    onClick={handleDownloadPDF}
                                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
                                    title="Baixar PDF"
                                    aria-label="Baixar PDF"
                                    disabled={isLoading}
                                >
                                    <Download className={`w-5 h-5 text-gray-700 group-hover:text-gray-900 ${isLoading ? 'animate-bounce' : ''}`} />
                                </button>

                                <button
                                    onClick={handleSharePDF}
                                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
                                    title="Partilhar PDF"
                                    aria-label="Partilhar PDF"
                                >
                                    <Share2 className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
                                </button>

                                <div className="w-px h-6 bg-gray-300 mx-1" />
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full bg-gray-100 hover:bg-red-50 transition-colors group"
                            title="Fechar painel"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5 text-gray-700 group-hover:text-red-600" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto px-6 py-6">
                    {document?.content ? (
                        <article className="prose prose-sm max-w-none
                                          prose-headings:font-bold prose-headings:text-gray-900
                                          prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
                                          prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
                                          prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                                          prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4
                                          prose-ul:my-4 prose-ul:space-y-2
                                          prose-ol:my-4 prose-ol:space-y-2
                                          prose-li:text-gray-700 prose-li:leading-7
                                          prose-strong:font-bold prose-strong:text-gray-900
                                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                          prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                          prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
                                          prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-gray-50/50 prose-blockquote:py-2 prose-blockquote:rounded-r
                                          prose-table:border-collapse prose-table:w-full
                                          prose-th:bg-gray-100 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                                          prose-td:border prose-td:border-gray-200 prose-td:p-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {document.content}
                            </ReactMarkdown>
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <p className="text-lg mb-2">Documento não disponível</p>
                                {document?.driveLink && (
                                    <button
                                        onClick={handleViewPDF}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Ver PDF no Google Drive
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </aside>
        </>
    );
}

export default DocumentPanel;
