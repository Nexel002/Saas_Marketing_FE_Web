'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { campaignService, Campaign, CampaignObjective, CampaignObjectiveInfo } from '@/lib/api';

/**
 * Campaigns Page
 * 
 * Lists all campaigns with filtering and detail views.
 */

const objectiveLabels: Record<CampaignObjective, string> = {
    BRAND_AWARENESS: 'Reconhecimento de Marca',
    LEAD_GENERATION: 'Geração de Leads',
    SALES: 'Vendas',
    ENGAGEMENT: 'Engajamento',
    TRAFFIC: 'Tráfego',
};

const objectiveIcons: Record<CampaignObjective, string> = {
    BRAND_AWARENESS: '🎯',
    LEAD_GENERATION: '📧',
    SALES: '💰',
    ENGAGEMENT: '💬',
    TRAFFIC: '🌐',
};

export default function CampaignsPage() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [filter, setFilter] = useState<CampaignObjective | 'ALL'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingContents, setIsGeneratingContents] = useState(false);

    useEffect(() => {
        loadCampaigns();
    }, [user, filter]);

    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            const objective = filter === 'ALL' ? undefined : filter;
            const response = await campaignService.list(objective);
            if (response.success && response.data) {
                setCampaigns(response.data);
            }
        } catch (err) {
            console.error('Failed to load campaigns:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (campaignId: string) => {
        if (!confirm('Tem certeza que quer eliminar esta campanha?')) return;

        try {
            await campaignService.delete(campaignId);
            setCampaigns(prev => prev.filter(c => c._id !== campaignId));
            if (selectedCampaign?._id === campaignId) {
                setSelectedCampaign(null);
            }
        } catch (err) {
            console.error('Failed to delete campaign:', err);
        }
    };

    const handleGenerateContents = async (campaignId: string) => {
        setIsGeneratingContents(true);
        try {
            await campaignService.generateContents(campaignId);
            alert('Conteúdos gerados com sucesso!');
        } catch (err: any) {
            alert(err.message || 'Erro ao gerar conteúdos');
        } finally {
            setIsGeneratingContents(false);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Campanhas</h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie suas campanhas de marketing
                    </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Filtrar:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as CampaignObjective | 'ALL')}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">Todas</option>
                        {Object.entries(objectiveLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {campaigns.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎯</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Ainda não tem campanhas
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Converse com o assistente para criar campanhas personalizadas para o seu negócio.
                    </p>
                    <a
                        href="/chat"
                        className="inline-flex px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        Criar Campanha com IA
                    </a>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Campaigns List */}
                    <div className="lg:col-span-1 space-y-3">
                        {campaigns.map((campaign) => (
                            <button
                                key={campaign._id}
                                onClick={() => setSelectedCampaign(campaign)}
                                className={`
                                    w-full text-left p-4 bg-white rounded-xl border transition-all
                                    ${selectedCampaign?._id === campaign._id
                                        ? 'border-primary shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">
                                        {objectiveIcons[campaign.objective]}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-800 truncate">
                                            {campaign.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {objectiveLabels[campaign.objective]}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(campaign.created_at).toLocaleDateString('pt-PT')}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Campaign Details */}
                    <div className="lg:col-span-2">
                        {selectedCampaign ? (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <span className="text-3xl">
                                                {objectiveIcons[selectedCampaign.objective]}
                                            </span>
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-800">
                                                    {selectedCampaign.name}
                                                </h2>
                                                <p className="text-gray-500 mt-1">
                                                    {objectiveLabels[selectedCampaign.objective]}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedCampaign.pdf_url && (
                                                <a
                                                    href={selectedCampaign.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                >
                                                    📄 PDF
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(selectedCampaign._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Details */}
                                <div className="p-6 space-y-6">
                                    {/* Summary */}
                                    {selectedCampaign.plan?.summary && (
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-2">Resumo</h4>
                                            <p className="text-gray-600 leading-relaxed">
                                                {selectedCampaign.plan.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Target Audience */}
                                    {selectedCampaign.plan?.target_audience && (
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-2">
                                                🎯 Público-Alvo
                                            </h4>
                                            <p className="text-gray-600">
                                                {selectedCampaign.plan.target_audience}
                                            </p>
                                        </div>
                                    )}

                                    {/* Channels */}
                                    {selectedCampaign.plan?.channels?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-2">
                                                📢 Canais
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCampaign.plan.channels.map((channel, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                                    >
                                                        {channel}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Strategies */}
                                    {selectedCampaign.plan?.strategies?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-2">
                                                💡 Estratégias
                                            </h4>
                                            <ul className="space-y-2">
                                                {selectedCampaign.plan.strategies.map((strategy, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-gray-600">
                                                        <span className="text-primary">•</span>
                                                        {strategy}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* KPIs */}
                                    {selectedCampaign.plan?.kpis?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-2">
                                                📊 KPIs
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCampaign.plan.kpis.map((kpi, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                                                    >
                                                        {kpi}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline & Budget */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {selectedCampaign.plan?.timeline && (
                                            <div className="p-4 bg-gray-50 rounded-xl">
                                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                                    📅 Cronograma
                                                </h4>
                                                <p className="text-gray-800">
                                                    {selectedCampaign.plan.timeline}
                                                </p>
                                            </div>
                                        )}
                                        {selectedCampaign.plan?.budget && (
                                            <div className="p-4 bg-gray-50 rounded-xl">
                                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                                    💵 Orçamento
                                                </h4>
                                                <p className="text-gray-800">
                                                    {selectedCampaign.plan.budget}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Generate Contents Button */}
                                    <button
                                        onClick={() => handleGenerateContents(selectedCampaign._id)}
                                        disabled={isGeneratingContents}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isGeneratingContents ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                A gerar conteúdos...
                                            </>
                                        ) : (
                                            <>
                                                <span>🎨</span>
                                                Gerar Imagens e Vídeos
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <p className="text-gray-500">
                                    Selecione uma campanha para ver os detalhes
                                </p>
                            </div>
                        )}
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
