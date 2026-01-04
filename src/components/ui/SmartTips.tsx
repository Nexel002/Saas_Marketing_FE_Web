'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Smart Tip Interface
 */
interface SmartTip {
    id: string;
    icon: string;
    title: string;
    description: string;
    action: {
        label: string;
        href: string;
    };
    priority: 'high' | 'medium' | 'low';
}

/**
 * SmartTips Props
 */
interface SmartTipsProps {
    hasBusiness: boolean;
    hasMarketResearch: boolean;
    hasStrategicPlan: boolean;
    hasCampaigns: boolean;
    totalCampaigns: number;
}

/**
 * Generate tips based on user state
 */
function generateTips({
    hasBusiness,
    hasMarketResearch,
    hasStrategicPlan,
    hasCampaigns,
    totalCampaigns
}: SmartTipsProps): SmartTip[] {
    const tips: SmartTip[] = [];

    // Priority 1: Business not configured
    if (!hasBusiness) {
        tips.push({
            id: 'setup-business',
            icon: '🏢',
            title: 'Configure seu negócio',
            description: 'Adicione as informações da sua empresa para personalizar as recomendações da IA.',
            action: { label: 'Configurar', href: '/business' },
            priority: 'high'
        });
    }

    // Priority 2: No market research
    if (hasBusiness && !hasMarketResearch) {
        tips.push({
            id: 'market-research',
            icon: '🔍',
            title: 'Descubra seu mercado',
            description: 'Gere uma análise completa do seu sector com inteligência artificial.',
            action: { label: 'Gerar Pesquisa', href: '/chat' },
            priority: 'high'
        });
    }

    // Priority 3: No strategic plan
    if (hasBusiness && hasMarketResearch && !hasStrategicPlan) {
        tips.push({
            id: 'strategic-plan',
            icon: '📋',
            title: 'Crie seu plano estratégico',
            description: 'Defina a identidade visual e estratégia de marketing do seu negócio.',
            action: { label: 'Criar Plano', href: '/chat' },
            priority: 'high'
        });
    }

    // Priority 4: No campaigns
    if (hasBusiness && !hasCampaigns) {
        tips.push({
            id: 'first-campaign',
            icon: '🎯',
            title: 'Lance sua primeira campanha',
            description: 'Crie campanhas de marketing personalizadas com ajuda da IA.',
            action: { label: 'Criar Campanha', href: '/chat' },
            priority: 'medium'
        });
    }

    // Tip: Generate content for campaigns
    if (totalCampaigns > 0) {
        tips.push({
            id: 'generate-content',
            icon: '🎨',
            title: 'Gere conteúdos visuais',
            description: 'Crie imagens e vídeos profissionais para suas campanhas.',
            action: { label: 'Gerar Conteúdo', href: '/campaigns' },
            priority: 'medium'
        });
    }

    // General tip: Talk to AI
    if (hasBusiness && hasMarketResearch && hasStrategicPlan && hasCampaigns) {
        tips.push({
            id: 'ai-ideas',
            icon: '💡',
            title: 'Explore novas ideias',
            description: 'Converse com a IA para descobrir novas estratégias de marketing.',
            action: { label: 'Conversar', href: '/chat' },
            priority: 'low'
        });
    }

    return tips.slice(0, 2); // Show max 2 tips
}

/**
 * SmartTips Component
 * 
 * Displays intelligent, contextual tips based on the user's
 * current state in the platform.
 */
export function SmartTips(props: SmartTipsProps) {
    const tips = generateTips(props);

    if (tips.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                <div className="p-2 rounded-lg bg-amber-50">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Dicas para você</h3>
            </div>

            {/* Tips List */}
            <div className="divide-y divide-gray-50">
                {tips.map((tip, index) => (
                    <div
                        key={tip.id}
                        className="p-4 hover:bg-gray-50/50 transition-all animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{tip.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                    {tip.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {tip.description}
                                </p>
                                <Link
                                    href={tip.action.href}
                                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
                                >
                                    {tip.action.label}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SmartTips;
