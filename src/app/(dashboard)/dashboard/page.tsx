'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, OnboardingProgress, NotificationList, SmartTips } from '@/components/ui';
import type { NotificationItem } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, DashboardSummary } from '@/lib/api';

/**
 * Dashboard Page
 * 
 * Modern, clean dashboard inspired by Nexus design.
 * Features: time-based greeting, onboarding progress, stats, notifications, smart tips.
 */
export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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
                    // Generate notifications based on data
                    setNotifications(generateNotifications(response.data));
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

    // Get greeting based on time of day
    const greeting = getTimeBasedGreeting();
    const firstName = user?.nome?.split(' ')[0] || 'Utilizador';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {greeting}, {firstName}! 👋
                </h1>
                <p className="text-text-secondary">
                    {data?.hasBusiness
                        ? `Negócio: ${data.business?.name}`
                        : 'Configure o seu negócio para começar'}
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-error rounded-xl text-error text-sm">
                    {error}
                </div>
            )}

            {/* Onboarding Progress */}
            <OnboardingProgress
                hasBusiness={data?.hasBusiness || false}
                hasMarketResearch={data?.stats?.hasMarketResearch || false}
                hasStrategicPlan={data?.stats?.hasStrategicPlan || false}
                hasCampaigns={(data?.stats?.totalCampaigns || 0) > 0}
            />

            {/* Stats Cards - Clean Nexus Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Campanhas"
                    value={data?.stats?.totalCampaigns?.toString() || '0'}
                    subtitle={data?.stats?.totalCampaigns === 1 ? 'campanha criada' : 'campanhas criadas'}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    }
                    color="pink"
                    href="/campaigns"
                />
                <StatCard
                    title="Pesquisa de Mercado"
                    value={data?.stats?.hasMarketResearch ? 'Activa' : 'Pendente'}
                    subtitle={data?.marketResearch?.generatedAt
                        ? `Gerada em ${formatDate(data.marketResearch.generatedAt)}`
                        : 'Não gerada ainda'}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    }
                    color="blue"
                    href="/research"
                />
                <StatCard
                    title="Plano Estratégico"
                    value={data?.stats?.hasStrategicPlan ? 'Activo' : 'Pendente'}
                    subtitle={data?.strategicPlan?.generatedAt
                        ? `Gerado em ${formatDate(data.strategicPlan.generatedAt)}`
                        : 'Não gerado ainda'}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    }
                    color="yellow"
                    href="/strategic-plan"
                />
            </div>

            {/* Bottom Grid: Notifications + Smart Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications */}
                <NotificationList
                    notifications={notifications}
                    onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                    onMarkAsRead={(id) => setNotifications(prev =>
                        prev.map(n => n.id === id ? { ...n, read: true } : n)
                    )}
                />

                {/* Smart Tips */}
                <SmartTips
                    hasBusiness={data?.hasBusiness || false}
                    hasMarketResearch={data?.stats?.hasMarketResearch || false}
                    hasStrategicPlan={data?.stats?.hasStrategicPlan || false}
                    hasCampaigns={(data?.stats?.totalCampaigns || 0) > 0}
                    totalCampaigns={data?.stats?.totalCampaigns || 0}
                />
            </div>
        </div>
    );
}

// =============================================
// Helper Functions
// =============================================

/**
 * Get greeting based on time of day
 */
function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

/**
 * Safe date formatting
 */
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Data desconhecida';
        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
    } catch {
        return 'Data desconhecida';
    }
}

/**
 * Generate notifications based on dashboard data
 */
function generateNotifications(data: DashboardSummary): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Check if market research is old (30+ days)
    if (data.marketResearch?.generatedAt) {
        const researchDate = new Date(data.marketResearch.generatedAt);
        const daysDiff = Math.floor((now.getTime() - researchDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 30) {
            notifications.push({
                id: 'research-old',
                title: 'Pesquisa de mercado desatualizada',
                message: `Sua pesquisa tem ${daysDiff} dias. Considere gerar uma nova análise.`,
                type: 'warning',
                timestamp: now.toISOString(),
            });
        }
    }

    // Welcome notification for new users
    if (!data.hasBusiness) {
        notifications.push({
            id: 'welcome',
            title: 'Bem-vindo ao PromoMo! 🎉',
            message: 'Configure seu negócio para começar a usar a plataforma.',
            type: 'info',
            timestamp: now.toISOString(),
        });
    }

    // Campaign created recently
    if (data.recentCampaigns && data.recentCampaigns.length > 0) {
        const lastCampaign = data.recentCampaigns[0];
        const campaignDate = new Date(lastCampaign.generatedAt);
        const hoursDiff = Math.floor((now.getTime() - campaignDate.getTime()) / (1000 * 60 * 60));
        if (hoursDiff < 24) {
            notifications.push({
                id: 'campaign-created',
                title: 'Campanha criada com sucesso!',
                message: `"${lastCampaign.name}" está pronta para uso.`,
                type: 'success',
                timestamp: lastCampaign.generatedAt,
            });
        }
    }

    return notifications;
}

// =============================================
// Sub-components
// =============================================

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: 'pink' | 'blue' | 'yellow' | 'purple';
    href?: string;
}

function StatCard({ title, value, subtitle, icon, color, href }: StatCardProps) {
    const colorStyles = {
        pink: 'bg-pink-50 text-pink-600',
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-amber-50 text-amber-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    const content = (
        <Card
            className={`relative overflow-hidden transition-all duration-200 ${href ? 'hover:shadow-md hover:border-gray-200 cursor-pointer' : ''}`}
            padding="lg"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
