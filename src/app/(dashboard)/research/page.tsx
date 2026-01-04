'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { researchService, MarketResearch } from '@/lib/api';

/**
 * Research Page
 * 
 * Displays market research with generation and viewing capabilities.
 */
export default function ResearchPage() {
    const { user } = useAuth();
    const [research, setResearch] = useState<MarketResearch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadResearch();
    }, [user]);

    const loadResearch = async () => {
        setIsLoading(true);
        try {
            const response = await researchService.list();
            if (response.success && response.data && response.data.length > 0) {
                setResearch(response.data[0]); // Get most recent
            }
        } catch (err) {
            console.error('Failed to load research:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const response = await researchService.generate();
            if (response.success && response.data) {
                setResearch(response.data);
            } else {
                setError(response.message || 'Erro ao gerar pesquisa');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar pesquisa');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!research?._id || !confirm('Tem certeza que quer eliminar esta pesquisa?')) return;

        try {
            await researchService.delete(research._id);
            setResearch(null);
        } catch (err) {
            console.error('Failed to delete research:', err);
        }
    };

    // Safe date formatting
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Data desconhecida';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Data desconhecida';
            return date.toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return 'Data desconhecida';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pesquisa de Mercado</h1>
                    <p className="text-gray-500 mt-1">
                        Análise detalhada do seu mercado e concorrência
                    </p>
                </div>

                {!research && (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                A gerar...
                            </>
                        ) : (
                            <>
                                <span>🔍</span>
                                Gerar Pesquisa
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                </div>
            )}

            {/* Content */}
            {research ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Research Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Pesquisa de Mercado
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gerada em {formatDate(research.created_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {research.drive_link && (
                                    <a
                                        href={research.drive_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                    >
                                        📁 Google Drive
                                    </a>
                                )}
                                {research.pdf_url && (
                                    <a
                                        href={research.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        📄 Download PDF
                                    </a>
                                )}
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Research Content */}
                    <div className="p-6">
                        {research.summary ? (
                            <div className="prose prose-sm max-w-none">
                                <h3 className="text-gray-800 font-medium mb-3">Resumo</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {research.summary}
                                </p>
                            </div>
                        ) : research.content ? (
                            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {research.content}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    O conteúdo está disponível no PDF ou Google Drive.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Ainda não tem pesquisa de mercado
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Gere uma análise detalhada do seu mercado, concorrência e oportunidades para o seu negócio.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? 'A gerar...' : 'Gerar Pesquisa de Mercado'}
                    </button>
                </div>
            )}

            {/* Generating Overlay */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            A gerar pesquisa...
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Isto pode demorar alguns minutos. Por favor aguarde.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icons
function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}
