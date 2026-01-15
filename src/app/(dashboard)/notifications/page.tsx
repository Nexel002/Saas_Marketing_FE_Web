'use client';

import { useState } from 'react';
import { NotificationList } from '@/components/ui';
import type { NotificationItem } from '@/components/ui';

/**
 * Notifications Page
 * 
 * Full screen view of all user notifications.
 */

// =============================================
// Mock Data (consistent with Header)
// =============================================

const initialNotifications: NotificationItem[] = [
    {
        id: '1',
        title: 'Campanha criada com sucesso',
        message: 'A sua campanha "Promoção de Verão" foi criada e está pronta para gerar conteúdos.',
        type: 'success',
        timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
        read: false
    },
    {
        id: '2',
        title: 'Novos conteúdos gerados',
        message: '5 novas imagens e 2 vídeos foram gerados para a campanha "Flores Premium".',
        type: 'campaign',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false
    },
    {
        id: '3',
        title: 'Pesquisa de mercado concluída',
        message: 'A análise de mercado para o seu negócio foi concluída. Clique para ver os resultados.',
        type: 'info',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        read: true
    },
    {
        id: '4',
        title: 'Plano estratégico pronto',
        message: 'O plano estratégico para "EGNA Flores" está disponível para visualização.',
        type: 'success',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        read: true
    }
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

    const handleDismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    Centro de Notificações
                </h1>
                <p className="text-text-secondary">
                    Fique por dentro das últimas atualizações e novidades.
                </p>
            </div>

            <div className="mt-8">
                <NotificationList
                    notifications={notifications}
                    onDismiss={handleDismiss}
                    onMarkAsRead={handleMarkAsRead}
                    maxVisible={10}
                />
            </div>

            {notifications.length > 0 && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Marcar todas como lidas
                    </button>
                </div>
            )}
        </div>
    );
}
