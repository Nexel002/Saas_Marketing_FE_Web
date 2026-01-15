'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Header Component
 * 
 * Top navigation bar for the dashboard.
 * Contains hamburger menu, page title, notifications, and user menu.
 */

// =============================================
// Types
// =============================================

interface HeaderProps {
    /** Title to display in header */
    title?: string;
    /** Callback when hamburger menu is clicked */
    onMenuClick?: () => void;
    /** User information */
    user?: {
        name: string;
        email?: string;
        avatar?: string;
    };
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'campaign';
    time: string;
    read: boolean;
}

// =============================================
// Mock Notifications (replace with real data later)
// =============================================

const mockNotifications: NotificationItem[] = [
    {
        id: '1',
        title: 'Campanha criada com sucesso',
        message: 'A sua campanha "Promoção de Verão" foi criada e está pronta para gerar conteúdos.',
        type: 'success',
        time: '2 min atrás',
        read: false
    },
    {
        id: '2',
        title: 'Novos conteúdos gerados',
        message: '5 novas imagens e 2 vídeos foram gerados para a campanha "Flores Premium".',
        type: 'campaign',
        time: '15 min atrás',
        read: false
    },
    {
        id: '3',
        title: 'Pesquisa de mercado concluída',
        message: 'A análise de mercado para o seu negócio foi concluída. Clique para ver os resultados.',
        type: 'info',
        time: '1 hora atrás',
        read: true
    },
    {
        id: '4',
        title: 'Plano estratégico pronto',
        message: 'O plano estratégico para "EGNA Flores" está disponível para visualização.',
        type: 'success',
        time: '2 horas atrás',
        read: true
    }
];

// =============================================
// Component
// =============================================

export function Header({ title, onMenuClick, user }: HeaderProps) {
    const router = useRouter();
    const { logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-notification-dropdown]')) {
                setIsNotificationsOpen(false);
            }
        };

        if (isNotificationsOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isNotificationsOpen]);

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        await logout();
        router.push('/login');
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getNotificationIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'success':
                return <div className="p-2 rounded-lg bg-green-50"><CheckIcon className="w-4 h-4 text-green-500" /></div>;
            case 'warning':
                return <div className="p-2 rounded-lg bg-amber-50"><WarningIcon className="w-4 h-4 text-amber-500" /></div>;
            case 'campaign':
                return <div className="p-2 rounded-lg bg-pink-50"><CampaignIcon className="w-4 h-4 text-pink-500" /></div>;
            default:
                return <div className="p-2 rounded-lg bg-blue-50"><InfoIcon className="w-4 h-4 text-blue-500" /></div>;
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-border">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    {/* Hamburger menu (mobile) */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors"
                        aria-label="Abrir menu"
                    >
                        <MenuIcon className="w-6 h-6 text-text-primary" />
                    </button>

                    {/* Page title */}
                    {title && (
                        <h1 className="text-lg font-semibold text-text-primary hidden sm:block">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <div className="relative" data-notification-dropdown>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsNotificationsOpen(!isNotificationsOpen);
                                setIsUserMenuOpen(false);
                            }}
                            className="p-2 rounded-lg hover:bg-surface transition-all duration-200 relative group"
                            aria-label="Notificações"
                        >
                            <BellIcon className={`w-5 h-5 transition-colors duration-200 ${isNotificationsOpen ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`} />

                            {/* Notification badge with pulse animation */}
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-error items-center justify-center text-[10px] font-bold text-white">
                                        {unreadCount}
                                    </span>
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsNotificationsOpen(false)}
                                />

                                {/* Dropdown Panel */}
                                <div
                                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                                    style={{
                                        animation: 'slideDown 0.25s ease-out forwards',
                                    }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                        <div className="flex items-center gap-2">
                                            <BellIcon className="w-5 h-5 text-gray-600" />
                                            <h3 className="font-semibold text-gray-800">Notificações</h3>
                                            {unreadCount > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                                                    {unreadCount} novas
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                            >
                                                Marcar todas como lidas
                                            </button>
                                        )}
                                    </div>

                                    {/* Notifications List */}
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <BellIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="text-sm text-gray-500">Nenhuma notificação</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.map((notification, index) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => markAsRead(notification.id)}
                                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                                            }`}
                                                        style={{
                                                            animation: `fadeSlideIn 0.3s ease-out forwards`,
                                                            animationDelay: `${index * 50}ms`,
                                                            opacity: 0,
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {getNotificationIcon(notification.type)}
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {notification.time}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    dismissNotification(notification.id);
                                                                }}
                                                                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <CloseIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                                            <Link
                                                href="/notifications"
                                                className="block text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                                onClick={() => setIsNotificationsOpen(false)}
                                            >
                                                Ver todas as notificações
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setIsUserMenuOpen(!isUserMenuOpen);
                                setIsNotificationsOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors"
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-pastel flex items-center justify-center">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-text-primary">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>

                            {/* Name (desktop) */}
                            <span className="text-sm font-medium text-text-primary hidden md:block">
                                {user?.name || 'Utilizador'}
                            </span>

                            <ChevronDownIcon className="w-4 h-4 text-text-muted hidden md:block" />
                        </button>

                        {/* Dropdown menu */}
                        {isUserMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsUserMenuOpen(false)}
                                />

                                {/* Menu */}
                                <div
                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-border py-2 z-20"
                                    style={{
                                        animation: 'slideDown 0.2s ease-out forwards',
                                    }}
                                >
                                    {/* User info */}
                                    <div className="px-4 py-2 border-b border-border mb-2">
                                        <p className="font-medium text-text-primary">{user?.name}</p>
                                        <p className="text-sm text-text-muted">{user?.email}</p>
                                    </div>

                                    {/* Menu items */}
                                    <Link
                                        href="/business"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <BusinessIcon className="w-4 h-4" />
                                        Meu Negócio
                                    </Link>

                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <SettingsIcon className="w-4 h-4" />
                                        Configurações
                                    </Link>

                                    <hr className="my-2 border-border" />

                                    <button
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error hover:bg-red-50 transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogoutIcon className="w-4 h-4" />
                                        Terminar Sessão
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </header>
    );
}

// =============================================
// Icon Components
// =============================================

function MenuIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function BusinessIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        </svg>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function LogoutIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function WarningIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function CampaignIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

export default Header;
