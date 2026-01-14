'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

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

interface MediaCarouselProps {
    items: MediaItem[];
    onViewAll?: () => void;
}

// =============================================
// Icons
// =============================================

const ChevronLeftIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

const VolumeOffIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
);

const VolumeUpIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

// =============================================
// Media Card Component
// =============================================

interface MediaCardProps {
    item: MediaItem;
    isMuted: boolean;
    onToggleMute: () => void;
    isActive: boolean;
}

function MediaCard({ item, isMuted, onToggleMute, isActive }: MediaCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Auto-play when active
    useEffect(() => {
        if (item.type === 'video' && videoRef.current) {
            if (isActive) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, item.type]);

    const handleDownload = async () => {
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
            // Fallback: open in new tab
            window.open(item.url, '_blank');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    url: item.url,
                });
            } catch (err) {
                // User cancelled or error
                copyToClipboard(item.url);
            }
        } else {
            copyToClipboard(item.url);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-900 group">
            {/* Media Content */}
            {item.type === 'image' ? (
                <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-800');
                        e.currentTarget.parentElement?.insertAdjacentHTML('beforeend',
                            '<p class="text-gray-400 text-xs text-center p-4">Não foi possível carregar a pré-visualização.<br>Use o botão de download.</p>'
                        );
                    }}
                />
            ) : (
                <video
                    ref={videoRef}
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    controls={false}
                    poster={item.thumbnail}
                />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={handleDownload}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="Baixar"
                >
                    <DownloadIcon className="w-4 h-4 text-gray-700" />
                </button>
                <button
                    onClick={handleShare}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="Partilhar"
                >
                    <ShareIcon className="w-4 h-4 text-gray-700" />
                </button>
                {item.type === 'video' && (
                    <button
                        onClick={onToggleMute}
                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                        title={isMuted ? 'Ativar som' : 'Silenciar'}
                    >
                        {isMuted ? (
                            <VolumeOffIcon className="w-4 h-4 text-gray-700" />
                        ) : (
                            <VolumeUpIcon className="w-4 h-4 text-gray-700" />
                        )}
                    </button>
                )}
            </div>

            {/* Video Indicator */}
            {item.type === 'video' && !isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================
// Main Carousel Component
// =============================================

export function MediaCarousel({ items, onViewAll }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [isTransitioning]);

    const goToPrevious = useCallback(() => {
        const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        goToSlide(newIndex);
    }, [currentIndex, items.length, goToSlide]);

    const goToNext = useCallback(() => {
        const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
        goToSlide(newIndex);
    }, [currentIndex, items.length, goToSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }
    }, [goToPrevious, goToNext]);

    if (items.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="mt-4 mb-2 relative"
            tabIndex={0}
            role="region"
            aria-label="Carrossel de mídia"
        >
            {/* Carousel Container */}
            <div className="relative aspect-[16/9] max-w-lg rounded-xl overflow-hidden shadow-lg">
                {/* Slides */}
                <div
                    className="flex transition-transform duration-300 ease-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((item, index) => (
                        <div key={item.id} className="w-full h-full flex-shrink-0">
                            <MediaCard
                                item={item}
                                isMuted={isMuted}
                                onToggleMute={() => setIsMuted(!isMuted)}
                                isActive={index === currentIndex}
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Próximo"
                        >
                            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                        </button>
                    </>
                )}

                {/* Slide Counter */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
                    {currentIndex + 1} / {items.length}
                </div>
            </div>

            {/* Dot Indicators */}
            {items.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`
                                w-2 h-2 rounded-full transition-all duration-300
                                ${index === currentIndex
                                    ? 'bg-primary w-6'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                }
                            `}
                            aria-label={`Ir para slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* View All Button */}
            {items.length > 1 && onViewAll && (
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-2 mx-auto mt-3 px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                    <GridIcon className="w-4 h-4" />
                    <span>Ver tudo ({items.length})</span>
                </button>
            )}
        </div>
    );
}

export default MediaCarousel;
