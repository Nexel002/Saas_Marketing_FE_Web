'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, ConversationSummary } from '@/lib/api';

/**
 * Sidebar Component
 * 
 * Main navigation sidebar with collapsible mode (icons only).
 * Includes navigation, conversation history, and user section.
 */

// =============================================
// Types
// =============================================

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// =============================================
// Navigation Items
// =============================================

const navItems: NavItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <DashboardIcon />,
    },
    {
        name: 'Assistente',
        href: '/chat',
        icon: <ChatIcon />,
    },
    {
        name: 'Pesquisa',
        href: '/research',
        icon: <SearchIcon />,
    },
    {
        name: 'Plano',
        href: '/strategic-plan',
        icon: <PlanIcon />,
    },
    {
        name: 'Campanhas',
        href: '/campaigns',
        icon: <CampaignIcon />,
    },
    {
        name: 'Conteúdos',
        href: '/contents',
        icon: <ContentIcon />,
    },
    {
        name: 'Negócio',
        href: '/business',
        icon: <BusinessIcon />,
    },
];

// =============================================
// Component
// =============================================

export function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter conversations based on search
    const filteredConversations = searchQuery
        ? conversations.filter(c =>
            (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;


    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const data = await chatService.getConversations();
            setConversations(data.slice(0, 10)); // Limit to 10 recent
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    const handleRenameConversation = async (id: string, newTitle: string) => {
        const success = await chatService.renameConversation(id, newTitle);
        if (success) {
            setConversations(prev => prev.map(c =>
                c._id === id ? { ...c, title: newTitle } : c
            ));
        }
    };

    const handleDeleteConversation = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar esta conversa?')) return;

        const success = await chatService.deleteConversation(id);
        if (success) {
            setConversations(prev => prev.filter(c => c._id !== id));
            if (pathname.includes(id)) {
                router.push('/chat');
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const firstName = user?.nome?.split(' ')[0] || 'Utilizador';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200
                    transform transition-all duration-300 ease-in-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Header - Logo & Collapse Button */}
                    <div className={`flex items-center h-16 border-b border-gray-200 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
                        {!isCollapsed && (
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <span className="text-xl font-bold text-gray-800">
                                    Promo<span className="text-primary">Mo</span>
                                </span>
                            </Link>
                        )}

                        {/* Collapse toggle */}
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden lg:flex"
                            title={isCollapsed ? 'Expandir' : 'Colapsar'}
                        >
                            <CollapseIcon className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Close button (mobile) */}
                        {!isCollapsed && (
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Fechar menu"
                            >
                                <CloseIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className={`px-2 py-4 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    title={isCollapsed ? item.name : undefined}
                                    className={`
                                        flex items-center gap-3 rounded-xl transition-all duration-200
                                        ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}
                                        text-sm font-medium
                                        ${isActive
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                                    {!isCollapsed && <span>{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider */}
                    <div className="mx-3 border-t border-gray-200" />

                    {/* Conversation History Section */}
                    <div className="flex-1 overflow-y-auto py-3">
                        {!isCollapsed && (
                            <div className="px-3 mb-3 space-y-2">
                                <span className="block px-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Conversas
                                </span>
                                {/* Search Input */}
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Pesquisar..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                        )}

                        {isCollapsed ? (
                            <div className="px-2">
                                <Link
                                    href="/chat"
                                    className="flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Nova conversa"
                                >
                                    <PlusIcon className="w-5 h-5 text-gray-500" />
                                </Link>
                            </div>
                        ) : (
                            <div className="px-2 space-y-1">
                                {/* New conversation button */}
                                <Link
                                    href="/chat"
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Nova conversa</span>
                                </Link>

                                {isLoadingConversations ? (
                                    <div className="flex justify-center py-4">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-gray-400">
                                        Sem conversas ainda
                                    </p>
                                ) : filteredConversations.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-gray-400">
                                        {searchQuery ? 'Nenhuma conversa encontrada' : 'Sem conversas ainda'}
                                    </p>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <ConversationItem
                                            key={conv._id}
                                            conversation={conv}
                                            isActive={pathname === `/chat` && new URLSearchParams(window.location.search).get('id') === conv._id}
                                            onRename={handleRenameConversation}
                                            onDelete={handleDeleteConversation}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer - User + Settings + Logout */}
                    <div className={`border-t border-gray-200 p-3 ${isCollapsed ? 'px-2' : ''}`}>
                        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
                            {/* User */}
                            <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'flex-1 min-w-0'}`}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                {!isCollapsed && (
                                    <span className="text-sm font-medium text-gray-700 truncate">
                                        {user?.nome || 'Utilizador'}
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1' : 'gap-1'}`}>
                                {/* Settings icon */}
                                <Link
                                    href="/settings"
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                                    title="Configurações"
                                >
                                    <SettingsIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                                </Link>

                                {/* Logout button */}
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                                    title="Sair"
                                >
                                    <LogoutIcon className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// =============================================
// Icon Components
// =============================================

function ConversationItem({
    conversation,
    isActive,
    onRename,
    onDelete
}: {
    conversation: ConversationSummary,
    isActive?: boolean,
    onRename: (id: string, title: string) => void,
    onDelete: (id: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title || '');

    const handleSave = (e?: React.FormEvent) => {
        e?.preventDefault();
        onRename(conversation._id, editTitle);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="px-2 py-1">
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSave()}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full text-sm px-2 py-1 border border-primary rounded bg-white focus:outline-none"
                />
            </div>
        );
    }

    return (
        <div className={`
            group flex items-center justify-between px-3 py-2 rounded-lg transition-colors
            ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}
        `}>
            <Link
                href={`/chat?id=${conversation._id}`}
                className="flex items-center gap-2 flex-1 min-w-0 pr-2"
            >
                <HistoryIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                <span className="truncate text-sm">
                    {conversation.title && !conversation.title.startsWith('[SYSTEM:')
                        ? conversation.title
                        : `Conversa ${conversation._id.slice(-4)}`
                    }
                </span>
            </Link>

            <div className="hidden group-hover:flex items-center gap-1">
                <button
                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500"
                    title="Renomear"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); onDelete(conversation._id); }}
                    className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-500"
                    title="Apagar"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
function DashboardIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function PlanIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function CampaignIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
    );
}

function ContentIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function BusinessIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function CollapseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function HistoryIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

export default Sidebar;
