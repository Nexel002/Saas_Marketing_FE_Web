'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Header Component
 * 
 * Top navigation bar for the dashboard.
 * Contains hamburger menu, page title, and user menu.
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

// =============================================
// Component
// =============================================

export function Header({ title, onMenuClick, user }: HeaderProps) {
    const router = useRouter();
    const { logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        await logout();
        router.push('/login');
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
                    {/* Notifications (placeholder) */}
                    <button
                        className="p-2 rounded-lg hover:bg-surface transition-colors relative"
                        aria-label="Notificações"
                    >
                        <BellIcon className="w-5 h-5 text-text-secondary" />
                        {/* Notification badge */}
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
                    </button>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-border py-2 z-20 animate-fade-in">
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

export default Header;
