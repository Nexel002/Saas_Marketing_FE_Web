'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, Button, MediaCarousel, ContentGalleryModal, MediaItem } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, SSEEvent } from '@/lib/api';

/**
 * Chat Page - Clean interface without secondary sidebar
 * 
 * Uses main sidebar for conversation history.
 */

// =============================================
// Types
// =============================================

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: string[];
    toolResultData?: any[];
    timestamp: Date;
}

interface Suggestion {
    icon: string;
    label: string;
    prompt: string;
}

// =============================================
// Suggestions
// =============================================

const suggestions: Suggestion[] = [
    {
        icon: '💡',
        label: 'Novas ideias para o negócio',
        prompt: 'Dá-me novas ideias criativas para promover o meu negócio',
    },
    {
        icon: '🎯',
        label: 'Criar nova campanha',
        prompt: 'Quero criar uma nova campanha de marketing',
    },
    {
        icon: '🔍',
        label: 'Pesquisa de mercado',
        prompt: 'Faz uma pesquisa de mercado para o meu negócio',
    },
    {
        icon: '📋',
        label: 'Plano estratégico',
        prompt: 'Gera um plano estratégico para a minha marca',
    },
];

// =============================================
// Component
// =============================================

export default function ChatPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const conversationIdFromUrl = searchParams.get('id');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load conversation if ID is in URL
    useEffect(() => {
        if (conversationIdFromUrl) {
            loadConversation(conversationIdFromUrl);
        } else {
            // Reset when no ID
            setMessages([]);
            setConversationId(null);
        }
    }, [conversationIdFromUrl]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Load a specific conversation
    const loadConversation = useCallback(async (convId: string) => {
        setIsLoadingConversation(true);
        try {
            const conv = await chatService.getConversation(convId);
            if (conv) {
                setConversationId(conv._id);
                const loadedMessages: Message[] = conv.messages
                    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                    .map((msg, index) => ({
                        id: `${conv._id}-${index}`,
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                        toolCalls: msg.tool_calls?.map(tc => tc.name) || [],
                        timestamp: new Date(msg.timestamp),
                    }));
                setMessages(loadedMessages);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        } finally {
            setIsLoadingConversation(false);
        }
    }, []);

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setCurrentTool(null);

        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            toolCalls: [],
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            let fullContent = '';

            // Inject User ID context for new conversations (invisible to user in UI but sent to API)
            // This prevents the AI from asking for the ID which should be handled by the system
            const messageToSend = (!conversationId && user?._id)
                ? `[SYSTEM: The current User ID is "${user._id}". Use this ID automatically for any tool calls that require a 'userId' parameter. Do NOT ask the user for their ID.]\n\n${messageText}`
                : messageText;

            for await (const event of chatService.sendMessage(messageToSend, conversationId || undefined)) {
                switch (event.event) {
                    case 'start':
                        if (event.data.conversationId) {
                            setConversationId(event.data.conversationId);
                        }
                        break;

                    case 'chunk':
                    case 'token':
                        let chunkText = '';
                        if (typeof event.data === 'string') {
                            chunkText = event.data;
                        } else if (event.data?.content) {
                            chunkText = event.data.content;
                        } else if (event.data?.text) {
                            chunkText = event.data.text;
                        } else if (event.data?.delta) {
                            chunkText = event.data.delta;
                        }

                        if (chunkText) {
                            fullContent += chunkText;
                        }

                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: fullContent }
                                    : msg
                            )
                        );
                        break;

                    case 'tool_call':
                        const toolName = event.data.name || event.data.tool;
                        if (toolName) {
                            setCurrentTool(toolName);
                        }
                        break;

                    case 'tool_result':
                        setCurrentTool(null);
                        if (event.data) {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, toolResultData: [...(msg.toolResultData || []), event.data] }
                                        : msg
                                )
                            );
                        }
                        break;

                    case 'done':
                        if (event.data.toolsUsed) {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, toolCalls: event.data.toolsUsed }
                                        : msg
                                )
                            );
                        }
                        break;

                    case 'error':
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: `Erro: ${event.data.error || 'Algo correu mal'}` }
                                    : msg
                            )
                        );
                        break;
                }
            }

            if (!fullContent) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: 'Não recebi resposta do servidor. Tente novamente.' }
                            : msg
                    )
                );
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: `Erro: ${error.message}` }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
            setCurrentTool(null);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasMessages = messages.length > 0;
    const firstName = user?.nome?.split(' ')[0] || 'Utilizador';

    return (
        <div className="flex flex-col -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 -mb-4 lg:-mb-6 h-[calc(100vh-4rem)] bg-white">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingConversation ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !hasMessages ? (
                    // Welcome screen
                    <div className="h-full flex flex-col items-center justify-center px-4">
                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                                Olá, {firstName}!
                            </h1>
                            <p className="text-gray-500">
                                Como posso ajudar o teu negócio hoje?
                            </p>
                        </div>

                        {/* Suggestions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full px-4">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSend(suggestion.prompt)}
                                    className="flex items-start gap-3 p-4 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                                >
                                    <span className="text-xl">{suggestion.icon}</span>
                                    <span className="text-sm text-gray-700">{suggestion.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages
                    <div className="max-w-3xl mx-auto py-6 px-4">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                userInitial={firstName.charAt(0).toUpperCase()}
                            />
                        ))}

                        {/* Tool indicator */}
                        {currentTool && (
                            <div className="flex items-center gap-2 py-4 text-sm text-primary">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span>A usar: {currentTool}</span>
                            </div>
                        )}

                        {/* Loading dots */}
                        {isLoading && !currentTool && messages[messages.length - 1]?.content === '' && (
                            <div className="flex items-start gap-4 py-4">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    P
                                </div>
                                <div className="flex gap-1 pt-3">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 pb-6">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex items-end bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors">
                        {/* Textarea */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pergunte ao assistente..."
                            rows={1}
                            className="flex-1 py-3 px-4 bg-transparent resize-none focus:outline-none text-gray-800 placeholder:text-gray-400 max-h-[200px]"
                            disabled={isLoading}
                        />

                        {/* Send button */}
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={`
                                m-2 p-2 rounded-full transition-colors
                                ${input.trim() && !isLoading
                                    ? 'bg-primary text-white hover:bg-primary/90'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            <ArrowUpIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 text-center mt-2">
                        PromoMo usa IA para gerar respostas. Verifique informações importantes.
                    </p>
                </div>
            </div>
        </div>
    );
}

// =============================================
// Sub-components
// =============================================

function MessageBubble({ message }: { message: Message; userInitial?: string }) {
    const isUser = message.role === 'user';
    const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
    const [galleryOpen, setGalleryOpen] = useState(false);

    // Helper to convert Google Drive viewer links to direct links
    const formatUrlForDisplay = (url: string): string => {
        // Handle Google Drive links
        // From: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        // To:   https://lh3.googleusercontent.com/d/FILE_ID
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
            // using lh3.googleusercontent.com/d/ is often more reliable for embeddings than drive.google.com/uc
            return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
        }
        return url;
    };

    // Extract media items from content
    const extractMedia = (content: string, toolResults?: any[]): { cleanContent: string; mediaItems: MediaItem[] } => {
        const mediaItems: MediaItem[] = [];
        const seenIds = new Set<string>();

        // 1. Extract from Tool Results (Source of Truth)
        if (toolResults) {
            toolResults.forEach(result => {
                // Check if result has 'contents' array (from list_campaign_contents or generate_campaign_contents)
                // The tool might return a stringified JSON, so we might need to parse it if it's a string
                let data = result;
                if (typeof result === 'string') {
                    try {
                        data = JSON.parse(result);
                    } catch (e) {
                        // ignore
                    }
                }

                // Sometimes the result is nested like { result: ... } or { output: ... }
                // Adjust based on your actual backend tool output structure.
                // Assuming result object has 'contents' property directly or result.result check.

                const contents = data.contents || (data.result && data.result.contents);

                if (Array.isArray(contents)) {
                    contents.forEach((item: any) => {
                        if (item.driveLink || item.drive_web_link) { // drive_web_link is what backend usually returns
                            const originalUrl = item.driveLink || item.drive_web_link;
                            const displayUrl = formatUrlForDisplay(originalUrl);

                            if (!seenIds.has(originalUrl)) {
                                seenIds.add(originalUrl);
                                mediaItems.push({
                                    id: originalUrl,
                                    type: (item.type === 'video' || item.content_type === 'video') ? 'video' : 'image',
                                    url: displayUrl,
                                    title: item.name || item.content_name || 'Conteúdo Gerado'
                                });
                            }
                        }
                    });
                }
            });
        }

        // 2. Extract from Markdown Text (Fallback & User pasted links)
        if (!content) return { cleanContent: '', mediaItems };

        const lines = content.split('\n');
        const remainingLines: string[] = [];

        lines.forEach(line => {
            // Updated Regex to match:
            // 1. Standard markdown images: ![alt](url)
            // 2. Explicit links with media keywords: [Ver Imagem](url), [Ver Vídeo](url), [Imagem 1](url)
            const mediaMatch = line.match(/(!)?\[(.*?)\]\((https?:\/\/[^\)]+)\)/i);

            let isMedia = false;

            if (mediaMatch) {
                const isMarkdownImage = !!mediaMatch[1]; // The "!" prefix
                const text = mediaMatch[2];
                const originalUrl = mediaMatch[3];

                const lowerText = text.toLowerCase();
                const isVideo = lowerText.includes('vídeo') || lowerText.includes('video') || lowerText.includes('assistir');
                const isImageKeyword = lowerText.includes('imagem') || lowerText.includes('image') || lowerText.includes('foto') || lowerText.includes('ver');

                if (isMarkdownImage || isVideo || isImageKeyword) {
                    // Check if we already have this URL from tool results
                    if (!seenIds.has(originalUrl)) {
                        isMedia = true;
                        seenIds.add(originalUrl);

                        const type = isVideo ? 'video' : 'image';

                        // Clean title
                        let title = line.replace(mediaMatch[0], '').trim();
                        title = title.replace(/^[\*\-]\s*/, '').replace(/:\s*$/, '').trim();

                        if (!title) title = (text !== 'Ver Imagem' && text !== 'Ver Vídeo') ? text : (type === 'video' ? 'Vídeo gerado' : 'Imagem gerada');

                        // Format URL for display (fix Google Drive links)
                        const displayUrl = formatUrlForDisplay(originalUrl);

                        mediaItems.push({
                            id: originalUrl,
                            type: type as 'image' | 'video',
                            url: displayUrl,
                            title: title
                        });
                    } else {
                        // It's a media link we already have from tool results. 
                        // We should probably NOT show the text link to avoid duplication, 
                        // UNLESS we want to keep the text flow. 
                        // Let's hide it from text if it's already in carousel.
                        isMedia = true;
                    }
                }
            }

            if (!isMedia) {
                remainingLines.push(line);
            }
        });

        // Add extra newline to ensure markdown renders correctly
        return {
            cleanContent: remainingLines.join('\n'),
            mediaItems
        };
    };

    const { cleanContent, mediaItems } = extractMedia(message.content, message.toolResultData);

    if (isUser) {
        return (
            <div className="flex justify-end mb-6">
                <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                {/* Message Content */}
                <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-a:text-primary prose-strong:font-semibold">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-4 my-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                    {children}
                                </a>
                            ),
                            code: ({ children }) => (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                            ),
                            pre: ({ children }) => (
                                <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm my-2">{children}</pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-200 pl-4 py-1 italic text-gray-600 my-2">{children}</blockquote>
                            ),
                        }}
                    >
                        {cleanContent || '...'}
                    </ReactMarkdown>
                </div>

                {/* Media Carousel */}
                {mediaItems.length > 0 && (
                    <div className="mt-4">
                        <MediaCarousel
                            items={mediaItems}
                            onViewAll={() => setGalleryOpen(true)}
                        />
                        <ContentGalleryModal
                            isOpen={galleryOpen}
                            onClose={() => setGalleryOpen(false)}
                            items={mediaItems}
                        />
                    </div>
                )}

                {/* Tool labels */}
                {hasToolCalls && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {message.toolCalls?.map((tool, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                                <span>⚡</span>
                                <span>{tool}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// Icon Components
// =============================================

function ArrowUpIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    );
}
