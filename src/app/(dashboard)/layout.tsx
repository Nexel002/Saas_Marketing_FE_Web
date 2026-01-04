'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard Layout
 * 
 * Wraps all authenticated pages with collapsible sidebar and header.
 * Handles responsive navigation state and auth protection.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">A verificar sessão...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Build user object for Header
    const headerUser = user ? {
        name: user.nome || 'Utilizador',
        email: user.email,
        avatar: user.profile_url,
    } : undefined;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main content area - adjusts based on sidebar state */}
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
                {/* Header */}
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    user={headerUser}
                />

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
