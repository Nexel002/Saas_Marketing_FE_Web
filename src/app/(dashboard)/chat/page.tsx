'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, Button } from '@/components/ui';
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
                        {message.content || '...'}
                    </ReactMarkdown>
                </div>

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
