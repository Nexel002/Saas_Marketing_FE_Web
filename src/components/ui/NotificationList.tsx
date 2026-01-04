'use client';

import React, { useState } from 'react';

/**
 * Notification Item Interface
 */
export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'campaign' | 'research';
    timestamp: string;
    read?: boolean;
}

/**
 * NotificationList Props
 */
interface NotificationListProps {
    notifications: NotificationItem[];
    onDismiss?: (id: string) => void;
    onMarkAsRead?: (id: string) => void;
    maxVisible?: number;
}

/**
 * Get icon for notification type
 */
const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
        case 'success':
            return (
                <div className="p-2 rounded-lg bg-green-50">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        case 'warning':
            return (
                <div className="p-2 rounded-lg bg-amber-50">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        case 'campaign':
            return (
                <div className="p-2 rounded-lg bg-pink-50">
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
            );
        case 'research':
            return (
                <div className="p-2 rounded-lg bg-blue-50">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="p-2 rounded-lg bg-gray-50">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
    }
};

/**
 * Format relative time
 */
const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};

/**
 * NotificationList Component
 * 
 * Displays a list of notifications with a clean, modern design
 * inspired by the reference image.
 */
export function NotificationList({
    notifications,
    onDismiss,
    onMarkAsRead,
    maxVisible = 5
}: NotificationListProps) {
    const [expanded, setExpanded] = useState(false);

    const visibleNotifications = expanded
        ? notifications
        : notifications.slice(0, maxVisible);

    const unreadCount = notifications.filter(n => !n.read).length;
    const hasMore = notifications.length > maxVisible;

    if (notifications.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gray-50">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800">Notificações</h3>
                </div>
                <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma notificação no momento
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800">Notificações</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Notification Items */}
            <div className="divide-y divide-gray-50">
                {visibleNotifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50/50 transition-all duration-200 animate-fade-in ${!notification.read ? 'bg-primary/5' : ''
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => onMarkAsRead?.(notification.id)}
                    >
                        <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatRelativeTime(notification.timestamp)}
                                </p>
                            </div>
                            {onDismiss && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDismiss(notification.id);
                                    }}
                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            {hasMore && (
                <div className="p-3 border-t border-gray-50">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full text-sm text-primary hover:text-primary-600 font-medium transition-colors"
                    >
                        {expanded ? 'Ver menos' : `Ver mais ${notifications.length - maxVisible} notificações`}
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotificationList;
