'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, DashboardSummary } from '@/lib/api';

/**
 * Dashboard Page
 * 
 * Main dashboard with statistics, recent activities, and quick actions.
 * Fetches real data from the API.
 */
export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                const response = await dashboardService.getSummary();
                if (response.success && response.data) {
                    setData(response.data);
                }
            } catch (err: any) {
                console.error('Error fetching dashboard:', err);
                setError('Erro ao carregar dados do dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    // Show loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-text-secondary">A carregar...</p>
                </div>
            </div>
        );
    }

    // Get user's first name for greeting
    const firstName = user?.nome?.split(' ')[0] || 'Utilizador';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Bem-vindo, {firstName}! 👋
                    </h1>
                    <p className="text-text-secondary mt-1">
                        {data?.hasBusiness
                            ? `Negócio: ${data.business?.name}`
                            : 'Configure o seu negócio para começar'}
                    </p>
                </div>

                <Link
                    href="/chat"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-soft"
                >
                    💬 Iniciar Conversa
                </Link>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-error rounded-lg text-error">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Campanhas"
                    value={data?.stats?.totalCampaigns?.toString() || '0'}
                    icon={<span className="text-2xl">🎯</span>}
                    color="bg-pink-500"
                />
                <StatCard
                    title="Pesquisa de Mercado"
                    value={data?.stats?.hasMarketResearch ? 'Concluída' : 'Pendente'}
                    subtitle={data?.marketResearch?.generatedAt
                        ? `Gerada em ${formatDate(data.marketResearch.generatedAt)}`
                        : undefined}
                    icon={<span className="text-2xl">🔍</span>}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Plano Estratégico"
                    value={data?.stats?.hasStrategicPlan ? 'Activo' : 'Não gerado'}
                    subtitle={data?.strategicPlan?.generatedAt
                        ? `Gerado em ${formatDate(data.strategicPlan.generatedAt)}`
                        : undefined}
                    icon={<span className="text-2xl">📋</span>}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Conversas"
                    value={data?.stats?.totalConversations?.toString() || '0'}
                    icon={<span className="text-2xl">💬</span>}
                    color="bg-purple-500"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Campaigns */}
                <Card className="lg:col-span-2" padding="lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Campanhas Recentes
                        </h2>
                        {data?.recentCampaigns && data.recentCampaigns.length > 0 && (
                            <Link
                                href="/campaigns"
                                className="text-sm font-medium text-primary hover:text-primary-600 hover:underline"
                            >
                                Ver todas
                            </Link>
                        )}
                    </div>

                    {data?.recentCampaigns && data.recentCampaigns.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentCampaigns.map((campaign) => (
                                <CampaignItem
                                    key={campaign.id}
                                    name={campaign.name}
                                    objective={campaign.objective}
                                    date={campaign.generatedAt}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100">
                            <span className="text-4xl block mb-3">🎯</span>
                            <p className="text-gray-500 font-medium">Ainda não tem campanhas</p>
                            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                Comece por criar uma nova campanha com a ajuda do nosso assistente de IA.
                            </p>
                            <Link
                                href="/chat"
                                className="inline-flex mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                            >
                                Criar Campanha
                            </Link>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-text-primary mb-6">
                        Começar Novo
                    </h2>

                    <div className="space-y-4">
                        <QuickActionButton
                            href="/chat"
                            icon="💡"
                            label="Nova Ideia"
                            description="Discuta novas estratégias com a IA"
                            color="bg-purple-500"
                        />
                        <QuickActionButton
                            href="/chat"
                            icon="🎯"
                            label="Nova Campanha"
                            description="Crie campanhas personalizadas"
                            color="bg-pink-500"
                        />
                        {!data?.stats?.hasMarketResearch && (
                            <QuickActionButton
                                href="/chat"
                                icon="🔍"
                                label="Pesquisa Mercado"
                                description="Analise o seu mercado alvo"
                                color="bg-blue-500"
                            />
                        )}
                        {!data?.stats?.hasStrategicPlan && (
                            <QuickActionButton
                                href="/chat"
                                icon="📋"
                                label="Plano Estratégico"
                                description="Defina a direção do seu negócio"
                                color="bg-yellow-500"
                            />
                        )}
                        {!data?.hasBusiness && (
                            <QuickActionButton
                                href="/business"
                                icon="🏢"
                                label="Configurar Negócio"
                                description="Preencha os dados da empresa"
                                color="bg-slate-800"
                            />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =============================================
// Sub-components
// =============================================

// Safe date formatting
const formatDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Data desconhecida';
        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
    } catch {
        return 'Data desconhecida';
    }
};

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden group" padding="md">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {subtitle}
                    </p>
                )}
            </div>
        </Card>
    );
}

interface CampaignItemProps {
    name: string;
    objective: string;
    date: string;
}

function CampaignItem({ name, objective, date }: CampaignItemProps) {
    const objectiveLabels: Record<string, string> = {
        BRAND_AWARENESS: 'Reconhecimento de Marca',
        LEAD_GENERATION: 'Geração de Leads',
        SALES: 'Vendas',
        ENGAGEMENT: 'Engajamento',
        TRAFFIC: 'Tráfego',
    };

    const objectiveColors: Record<string, string> = {
        BRAND_AWARENESS: 'bg-purple-100 text-purple-700',
        LEAD_GENERATION: 'bg-blue-100 text-blue-700',
        SALES: 'bg-green-100 text-green-700',
        ENGAGEMENT: 'bg-pink-100 text-pink-700',
        TRAFFIC: 'bg-orange-100 text-orange-700',
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className={`p-3 rounded-lg ${objectiveColors[objective] || 'bg-gray-100 text-gray-600'}`}>
                <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                        {objectiveLabels[objective] || objective}
                    </span>
                    <span>•</span>
                    <span>{formatDate(date)}</span>
                </div>
            </div>
            <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}

interface QuickActionButtonProps {
    href: string;
    icon: string;
    label: string;
    description?: string;
    color?: string;
}

function QuickActionButton({ href, icon, label, description, color = "bg-primary" }: QuickActionButtonProps) {
    return (
        <Link
            href={href}
            className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm hover:bg-gray-50 transition-all group"
        >
            <div className={`p-3 rounded-xl text-white ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                <span className="text-xl">{icon}</span>
            </div>
            <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {label}
                </h4>
                {description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </Link>
    );
}
