'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { contentService, businessService, ContentItem, MediaContentItem } from '@/lib/api';
import { ContentGalleryModal } from '@/components/ui';

/**
 * Contents Page
 * 
 * Displays all generated content for a business in a Pinterest-style masonry layout.
 * Features:
 * - Masonry grid layout (2/3/4 columns responsive)
 * - Campaign filtering
 * - Type filtering (All/Images/Videos)
 * - Smooth fade-in animations
 * - Modal preview with carousel
 * - Google Drive integration
 */

// CSS Animation Keyframes (injected into document head)
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    if (!document.head.querySelector('style[data-content-animations]')) {
        style.setAttribute('data-content-animations', 'true');
        document.head.appendChild(style);
    }
}

// =============================================
// Lazy Image Component - Prevents Rate Limiting
// =============================================

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    index: number;
    onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function LazyImage({ src, alt, className, index, onError }: LazyImageProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Use IntersectionObserver to detect when image is in viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Staggered loading: add delay based on index to prevent rate limiting
    useEffect(() => {
        if (isVisible) {
            // First 4 images load immediately, then stagger with 150ms delay per image
            const delay = index < 4 ? 0 : (index - 4) * 150;
            const timer = setTimeout(() => setShouldLoad(true), delay);
            return () => clearTimeout(timer);
        }
    }, [isVisible, index]);

    return (
        <div ref={imgRef} className="relative">
            {/* Loading skeleton */}
            {!isLoaded && (
                <div className="w-full aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg" />
            )}

            {/* Actual image - only loads when shouldLoad is true */}
            {shouldLoad && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        setIsLoaded(true);
                        onError?.(e);
                    }}
                    style={{ position: isLoaded ? 'relative' : 'absolute', top: 0, left: 0 }}
                />
            )}
        </div>
    );
}

type FilterType = 'ALL' | 'IMAGE' | 'VIDEO';

export default function ContentsPage() {
    const { user } = useAuth();
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');
    const [selectedType, setSelectedType] = useState<FilterType>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [businessId, setBusinessId] = useState<string>('');
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Fetch business ID on mount
    useEffect(() => {
        loadBusinessAndContents();
    }, []);

    // Setup Intersection Observer for fade-in animations
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Observe content cards for animations
    useEffect(() => {
        if (!observerRef.current) return;

        const cards = document.querySelectorAll('.content-card');
        cards.forEach(card => {
            observerRef.current?.observe(card);
        });

        return () => {
            cards.forEach(card => {
                observerRef.current?.unobserve(card);
            });
        };
    }, [filteredContents]);

    // Filter contents when filters change
    useEffect(() => {
        let filtered = [...contents];

        // Filter by campaign
        if (selectedCampaign !== 'ALL') {
            filtered = filtered.filter(c => c.campaignName === selectedCampaign);
        }

        // Filter by type
        if (selectedType !== 'ALL') {
            filtered = filtered.filter(c => c.type === selectedType);
        }

        setFilteredContents(filtered);
    }, [contents, selectedCampaign, selectedType]);

    const loadBusinessAndContents = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // First, get the business
            const businessResponse = await businessService.getAll();
            if (businessResponse.success && businessResponse.data && businessResponse.data.length > 0) {
                const biz = businessResponse.data[0];
                setBusinessId(biz._id);

                // Then load contents for that business
                const response = await contentService.getAllBusinessContents(biz._id);
                if (response.success && response.data) {
                    setContents(response.data);
                    setFilteredContents(response.data);
                }
            } else {
                setError('Nenhum negócio encontrado. Por favor, crie um negócio primeiro.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar conteúdos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = (index: number) => {
        setSelectedIndex(index);
        setShowGallery(true);
    };

    // Get unique campaigns for filter dropdown
    const campaigns = contentService.getUniqueCampaigns(contents);

    // Convert to media items for gallery
    const mediaItems: MediaContentItem[] = contentService.convertToMediaItems(filteredContents);

    const imageCount = filteredContents.filter(c => c.type === 'IMAGE').length;
    const videoCount = filteredContents.filter(c => c.type === 'VIDEO').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Carregando conteúdos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao Carregar</h3>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={loadBusinessAndContents}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (contents.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center bg-white rounded-2xl border border-gray-200 p-12 max-w-md">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎨</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Ainda não há conteúdos
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Crie campanhas e gere conteúdos visuais para começar.
                    </p>
                    <a
                        href="/campaigns"
                        className="inline-flex px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        Ver Campanhas
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-gray-200">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Conteúdos Gerados
                    </h1>
                    <p className="text-base text-gray-600 flex items-center gap-2">
                        {imageCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                🖼️ {imageCount} {imageCount === 1 ? 'imagem' : 'imagens'}
                            </span>
                        )}
                        {videoCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                                🎬 {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}
                            </span>
                        )}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Campaign Filter */}
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[200px] cursor-pointer hover:border-gray-300"
                    >
                        <option value="ALL">📁 Todas as Campanhas</option>
                        {campaigns.map((campaign) => (
                            <option key={campaign.name} value={campaign.name}>
                                {campaign.name} ({campaign.count})
                            </option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setSelectedType('ALL')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedType === 'ALL'
                                ? 'bg-white text-gray-900 shadow-md scale-105'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setSelectedType('IMAGE')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedType === 'IMAGE'
                                ? 'bg-white text-gray-900 shadow-md scale-105'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            🖼️ Imagens
                        </button>
                        <button
                            onClick={() => setSelectedType('VIDEO')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedType === 'VIDEO'
                                ? 'bg-white text-gray-900 shadow-md scale-105'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            🎬 Vídeos
                        </button>
                    </div>
                </div>
            </div>

            {/* Masonry Grid */}
            {filteredContents.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
                    <div className="max-w-md mx-auto space-y-3">
                        <div className="text-6xl mb-3">🔍</div>
                        <h3 className="text-lg font-semibold text-gray-800">Nenhum conteúdo encontrado</h3>
                        <p className="text-gray-600">Tente ajustar os filtros ou gere novos conteúdos</p>
                    </div>
                </div>
            ) : (
                <div
                    className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6"
                    style={{
                        columnGap: '1.5rem',
                    }}
                >
                    {mediaItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="mb-6 break-inside-avoid"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                            }}
                        >
                            <ContentCard
                                item={item}
                                index={index}
                                onClick={() => handleCardClick(index)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Gallery Modal */}
            {showGallery && (
                <ContentGalleryModal
                    isOpen={showGallery}
                    onClose={() => setShowGallery(false)}
                    items={mediaItems}
                    campaignName={selectedCampaign !== 'ALL' ? selectedCampaign : 'Todos os Conteúdos'}
                />
            )}
        </div>
    );
}

// =============================================
// Content Card Component
// =============================================

interface ContentCardProps {
    item: MediaContentItem;
    index: number;
    onClick: () => void;
}

function ContentCard({ item, index, onClick }: ContentCardProps) {
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
            window.open(item.originalUrl || item.url, '_blank');
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    url: item.originalUrl || item.url,
                });
            } catch (err) {
                navigator.clipboard.writeText(item.originalUrl || item.url);
            }
        } else {
            navigator.clipboard.writeText(item.originalUrl || item.url);
        }
    };

    const handleClick = () => {
        // For videos, open in Google Drive directly to avoid CSP issues
        if (item.type === 'video' && item.originalUrl) {
            window.open(item.originalUrl, '_blank', 'noopener,noreferrer');
        } else {
            onClick();
        }
    };

    return (
        <div
            className="gallery-card relative rounded-xl overflow-hidden cursor-pointer group break-inside-avoid mb-4 bg-gray-100"
            onClick={handleClick}
            style={{
                animation: 'fadeInUp 0.5s ease-out forwards',
            }}
        >
            {/* Thumbnail */}
            {item.type === 'image' ? (
                <LazyImage
                    src={item.url}
                    alt={item.title}
                    index={index}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-state')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error-state w-full aspect-square bg-gray-200 flex items-center justify-center';
                            errorDiv.innerHTML = '<div class="text-center text-gray-400"><span class="text-4xl block mb-2">🖼️</span><p class="text-sm">Imagem não disponível</p></div>';
                            parent.appendChild(errorDiv);
                        }
                    }}
                />
            ) : (
                <div className="relative">
                    {/* Video uses same lh3 thumbnail URL */}
                    <LazyImage
                        src={item.url}
                        alt={item.title}
                        index={index}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.error-state')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-state w-full aspect-video bg-gray-800 flex items-center justify-center';
                                errorDiv.innerHTML = '<div class="text-center text-gray-400"><span class="text-4xl block mb-2">🎬</span><p class="text-sm">Clique para ver vídeo</p></div>';
                                parent.appendChild(errorDiv);
                            }
                        }}
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <PlayIcon className="w-6 h-6 text-gray-800 ml-0.5" />
                        </div>
                    </div>
                    {/* Video Badge */}
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
// Icons
// =============================================

function PlayIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}
