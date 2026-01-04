'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MediaItem } from './MediaCarousel';

// =============================================
// Types
// =============================================

interface ContentGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: MediaItem[];
    campaignName?: string;
}

// =============================================
// Icons
// =============================================

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
    </svg>
);

// =============================================
// Gallery Card Component
// =============================================

interface GalleryCardProps {
    item: MediaItem;
    onClick: () => void;
}

function GalleryCard({ item, onClick }: GalleryCardProps) {
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(item.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.title || `content.${item.type === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            window.open(item.url, '_blank');
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    url: item.url,
                });
            } catch (err) {
                navigator.clipboard.writeText(item.url);
            }
        } else {
            navigator.clipboard.writeText(item.url);
        }
    };

    return (
        <div
            className="gallery-card relative rounded-xl overflow-hidden cursor-pointer group break-inside-avoid mb-4 bg-gray-100"
            onClick={onClick}
        >
            {/* Thumbnail */}
            {item.type === 'image' ? (
                <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
            ) : (
                <div className="relative">
                    <video
                        src={item.url}
                        className="w-full h-auto object-cover"
                        poster={item.thumbnail}
                        preload="metadata"
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <PlayIcon className="w-6 h-6 text-gray-800 ml-0.5" />
                        </div>
                    </div>
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium">
                        Vídeo
                    </div>
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={handleDownload}
                    className="p-2 bg-white rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Baixar"
                >
                    <DownloadIcon className="w-4 h-4 text-gray-700" />
                </button>
                <button
                    onClick={handleShare}
                    className="p-2 bg-white rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Partilhar"
                >
                    <ShareIcon className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
            </div>

            {/* Save Button (Pinterest style) */}
            <button
                onClick={handleDownload}
                className="absolute top-2 left-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            >
                Salvar
            </button>
        </div>
    );
}

// =============================================
// Preview Modal Component
// =============================================

interface PreviewModalProps {
    item: MediaItem | null;
    onClose: () => void;
}

function PreviewModal({ item, onClose }: PreviewModalProps) {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (item?.type === 'video' && videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, [item]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!item) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/90" />

            <div
                className="relative max-w-4xl max-h-[90vh] z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                >
                    <CloseIcon className="w-8 h-8" />
                </button>

                {/* Content */}
                {item.type === 'image' ? (
                    <img
                        src={item.url}
                        alt={item.title}
                        className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                    />
                ) : (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            src={item.url}
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                            muted={isMuted}
                            controls
                            loop
                            playsInline
                        />
                    </div>
                )}

                {/* Title */}
                <p className="mt-4 text-white text-center text-lg font-medium">{item.title}</p>
            </div>
        </div>
    );
}

// =============================================
// Main Gallery Modal Component
// =============================================

export function ContentGalleryModal({ isOpen, onClose, items, campaignName }: ContentGalleryModalProps) {
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !previewItem) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, previewItem]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const imageCount = items.filter(i => i.type === 'image').length;
    const videoCount = items.filter(i => i.type === 'video').length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className="relative z-10 w-full max-w-6xl max-h-[95vh] mt-8 mb-8 mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {campaignName || 'Conteúdos da Campanha'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {imageCount > 0 && `${imageCount} ${imageCount === 1 ? 'imagem' : 'imagens'}`}
                            {imageCount > 0 && videoCount > 0 && ' • '}
                            {videoCount > 0 && `${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Gallery Grid - Pinterest Masonry */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-5rem)]">
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                        {items.map((item) => (
                            <GalleryCard
                                key={item.id}
                                item={item}
                                onClick={() => setPreviewItem(item)}
                            />
                        ))}
                    </div>

                    {items.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Nenhum conteúdo encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            <PreviewModal
                item={previewItem}
                onClose={() => setPreviewItem(null)}
            />
        </div>
    );
}

export default ContentGalleryModal;
