'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { strategicPlanService, StrategicPlan } from '@/lib/api';

/**
 * Strategic Plan Page
 * 
 * Displays strategic plan with mission, vision, values and other brand elements.
 */
export default function StrategicPlanPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<StrategicPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPlan();
    }, [user]);

    const loadPlan = async () => {
        setIsLoading(true);
        try {
            const response = await strategicPlanService.list();
            if (response.success && response.data && response.data.length > 0) {
                setPlan(response.data[0]);
            }
        } catch (err) {
            console.error('Failed to load plan:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const response = await strategicPlanService.generate();
            if (response.success && response.data) {
                setPlan(response.data);
            } else {
                setError(response.message || 'Erro ao gerar plano');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar plano');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!plan?._id || !confirm('Tem certeza que quer eliminar este plano?')) return;

        try {
            await strategicPlanService.delete(plan._id);
            setPlan(null);
        } catch (err) {
            console.error('Failed to delete plan:', err);
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

    // Extract content from plan
    const content = plan?.content || {};
    const mission = content.mission || plan?.mission;
    const vision = content.vision || plan?.vision;
    const values = content.values || plan?.values || [];
    const valueProposition = content.valueProposition || plan?.valueProposition;
    const brandTone = content.brandTone || plan?.brandTone;
    const colorPalette = content.colorPalette || plan?.colorPalette || [];

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
                    <h1 className="text-2xl font-bold text-gray-800">Plano Estratégico</h1>
                    <p className="text-gray-500 mt-1">
                        Missão, visão e identidade da sua marca
                    </p>
                </div>

                {!plan && (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                A gerar...
                            </>
                        ) : (
                            <>
                                <span>📋</span>
                                Gerar Plano
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
            {plan ? (
                <div className="space-y-6">
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">
                            Gerado em {formatDate(plan.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                            {plan.drive_link && (
                                <a
                                    href={plan.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    📁 Google Drive
                                </a>
                            )}
                            {plan.pdf_url && (
                                <a
                                    href={plan.pdf_url}
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

                    {/* Mission & Vision */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {mission && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-xl">🎯</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Missão</h3>
                                </div>
                                <p className="text-gray-600 leading-relaxed">{mission}</p>
                            </div>
                        )}

                        {vision && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <span className="text-xl">🔭</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Visão</h3>
                                </div>
                                <p className="text-gray-600 leading-relaxed">{vision}</p>
                            </div>
                        )}
                    </div>

                    {/* Values */}
                    {values.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <span className="text-xl">💎</span>
                                </div>
                                <h3 className="font-semibold text-gray-800">Valores</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {values.map((value, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                                    >
                                        {value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Value Proposition */}
                    {valueProposition && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <span className="text-xl">✨</span>
                                </div>
                                <h3 className="font-semibold text-gray-800">Proposta de Valor</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{valueProposition}</p>
                        </div>
                    )}

                    {/* Brand Tone & Colors */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {brandTone && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                        <span className="text-xl">🗣️</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Tom da Marca</h3>
                                </div>
                                <p className="text-gray-600 leading-relaxed">{brandTone}</p>
                            </div>
                        )}

                        {colorPalette.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-xl">🎨</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Paleta de Cores</h3>
                                </div>
                                <div className="flex gap-2">
                                    {colorPalette.map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-12 h-12 rounded-xl border border-gray-200 shadow-sm"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Ainda não tem um plano estratégico
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Gere a missão, visão, valores e identidade da sua marca com base na pesquisa de mercado.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? 'A gerar...' : 'Gerar Plano Estratégico'}
                    </button>
                </div>
            )}

            {/* Generating Overlay */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            A gerar plano estratégico...
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
