'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, SSEEvent, assetsService, businessService } from '@/lib/api';
import { DocumentPanelState, Document } from '@/types/document';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { getToolFriendlyName } from '@/lib/chatHelpers';
import { MessageBubble, Message } from '@/components/chat/MessageBubble';

// Lazy load heavy components - only load when needed
const DocumentPanel = dynamic(() => import('@/components/chat/DocumentPanel'), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full" />,
    ssr: false
});

/**
 * Chat Page - Clean interface without secondary sidebar
 * 
 * Uses main sidebar for conversation history.
 */

// =============================================
// Types
// =============================================

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
    const [documentPanel, setDocumentPanel] = useState<DocumentPanelState>({
        isOpen: false,
        document: undefined
    });

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [businessId, setBusinessId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice recognition
    const {
        isListening,
        isSupported: isVoiceSupported,
        transcript,
        interimTranscript,
        toggleListening,
        resetTranscript,
        error: voiceError
    } = useVoiceRecognition({
        language: 'pt-PT'
    });

    // Handle voice stop - capture text
    useEffect(() => {
        if (!isListening && (transcript || interimTranscript)) {
            const fullText = transcript + interimTranscript;
            if (fullText.trim()) {
                setInput(prev => {
                    if (prev.endsWith(fullText)) return prev;
                    return prev + (prev ? ' ' : '') + fullText;
                });
                resetTranscript();
            }
        }
    }, [isListening, transcript, interimTranscript, resetTranscript]);

    // Load conversation if ID is in URL
    useEffect(() => {
        if (conversationIdFromUrl) {
            loadConversation(conversationIdFromUrl);
        } else {
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

    // Load business ID on mount
    useEffect(() => {
        const loadBusinessId = async () => {
            try {
                const response = await businessService.getAll();
                if (response.success && response.data && response.data.length > 0) {
                    setBusinessId(response.data[0]._id);
                }
            } catch (error) {
                console.error('Failed to load business:', error);
            }
        };
        loadBusinessId();
    }, []);

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles: File[] = [];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

            if (selectedFiles.length + files.length > 5) {
                setUploadError('Máximo de 5 imagens permitido.');
                return;
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!allowedTypes.includes(file.type)) {
                    setUploadError(`Tipo de arquivo não suportado: ${file.name}. Use JPEG, PNG, GIF ou WebP.`);
                    continue;
                }

                if (file.size > 10 * 1024 * 1024) {
                    setUploadError(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
                    continue;
                }

                newFiles.push(file);
            }

            if (newFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...newFiles]);
                setUploadError(null);
            }
        }
        event.target.value = '';
    };

    // Remove file from selection
    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Helper to upload a single file
    const uploadSingleFile = async (file: File): Promise<{ url: string; name: string; driveLink?: string } | null> => {
        if (!businessId) return null;
        try {
            const response = await assetsService.uploadAsset(businessId, file, 'product');
            if (response.success && response.data) {
                return {
                    url: response.data.driveWebLink || '',
                    name: file.name,
                    driveLink: response.data.driveWebLink
                };
            }
        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
        }
        return null;
    };

    // Handle paste event for images
    const handlePaste = (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const newFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.type.startsWith('image/')) {
                event.preventDefault();

                const file = item.getAsFile();
                if (!file) continue;

                if (selectedFiles.length + newFiles.length >= 5) {
                    setUploadError('Máximo de 5 imagens permitido.');
                    break;
                }

                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    continue;
                }

                if (file.size > 10 * 1024 * 1024) {
                    continue;
                }

                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                const extension = file.type.split('/')[1] || 'png';
                const renamedFile = new File([file], `pasted_image_${timestamp}_${i}.${extension}`, { type: file.type });

                newFiles.push(renamedFile);
            }
        }

        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);
            setUploadError(null);
        }
    };


    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        const hasFiles = selectedFiles.length > 0;

        if ((!messageText && !hasFiles) || isLoading || isUploading) return;

        let uploadedImagesData: Array<{ url: string; name: string; driveLink?: string }> = [];

        if (hasFiles) {
            if (!businessId) {
                setUploadError('Erro: ID do negócio não encontrado. Recarregue a página.');
                return;
            }

            setIsUploading(true);
            try {
                let successCount = 0;

                for (const file of selectedFiles) {
                    try {
                        const result = await uploadSingleFile(file);
                        if (result) {
                            uploadedImagesData.push(result);
                            successCount++;
                        }
                    } catch (innerError) {
                        console.error(`Exceção no upload de ${file.name}:`, innerError);
                    }
                }

                if (successCount === 0) {
                    setUploadError(`Falha no upload. Todas as ${selectedFiles.length} imagens falharam.`);
                    setIsUploading(false);
                    return;
                }

            } catch (err: any) {
                console.error('Error uploading batch:', err);
                setUploadError(`Erro crítico ao enviar imagens: ${err.message || 'Erro desconhecido'}`);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        let userContent = messageText;
        if (uploadedImagesData.length > 0) {
            if (!userContent) {
                userContent = `Enviei ${uploadedImagesData.length} imagem(ns): ${uploadedImagesData.map(img => img.name).join(', ')}`;
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
            uploadedImages: uploadedImagesData.length > 0 ? uploadedImagesData : undefined,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedFiles([]);
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

            const messageToSend = (!conversationId && user?._id)
                ? `[SYSTEM: The current User ID is "${user._id}". Use this ID automatically for any tool calls that require a 'userId' parameter. Do NOT ask the user for their ID.]\n\n${userContent}`
                : userContent;

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

                    case 'document':
                        if (event.data) {
                            const doc: Document = {
                                id: event.data.documentId || Date.now().toString(),
                                type: event.data.type,
                                title: event.data.title,
                                content: event.data.content,
                                driveLink: event.data.driveLink,
                                pdfFileName: event.data.pdfFileName,
                                createdAt: new Date()
                            };

                            setDocumentPanel({
                                isOpen: true,
                                document: doc
                            });

                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, documents: [...(msg.documents || []), doc] }
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
        <div className="flex h-[calc(100vh-4rem)] bg-white -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 -mb-4 lg:-mb-6">
            {/* Main Chat Area */}
            <div className={`flex flex-col transition-all duration-300 ${documentPanel.isOpen ? 'lg:w-1/2' : 'w-full'}`}>
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
                                    onViewDocument={(doc) => setDocumentPanel({ isOpen: true, document: doc })}
                                />
                            ))}

                            {/* Tool indicator - User-friendly */}
                            {currentTool && (
                                <div className="flex items-center gap-3 py-4">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">
                                        A fazer: {getToolFriendlyName(currentTool)}
                                    </span>
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
                        {/* File Preview (Multiple) */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-3">
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent px-1">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="relative flex-shrink-0 group">
                                            {/* Image */}
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Remove Button */}
                                            {!isUploading && (
                                                <button
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="absolute -top-2 -right-2 bg-gray-900/90 text-white rounded-full p-1 shadow-lg hover:bg-black transition-all transform hover:scale-105"
                                                    title="Remover imagem"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Loading State Overlay */}
                                    {isUploading && (
                                        <div className="w-20 h-20 rounded-xl bg-gray-50 border border-dashed border-primary/50 flex flex-col items-center justify-center text-primary flex-shrink-0 animate-pulse">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                                            <span className="text-[10px] font-medium">A enviar...</span>
                                        </div>
                                    )}
                                </div>

                                {uploadError && (
                                    <p className="mt-1 text-xs text-red-500 pl-1">{uploadError}</p>
                                )}
                            </div>
                        )}

                        {/* Upload Error (when no file selected) */}
                        {uploadError && selectedFiles.length === 0 && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm text-red-600">{uploadError}</p>
                            </div>
                        )}

                        <div className="relative flex items-end bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors p-2 gap-2">
                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* Attachment Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 mb-[2px] text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                title="Anexar imagem"
                                disabled={isLoading || isUploading}
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>

                            {/* Textarea or Voice Visualizer */}
                            {isListening ? (
                                <div className="flex-1 flex items-center gap-3 py-3 px-2 overflow-hidden h-[46px]">
                                    {/* Animated Wave */}
                                    <div className="flex items-center gap-1 h-full select-none">
                                        <div className="w-1 bg-primary rounded-full animate-[wave_1s_ease-in-out_infinite]" style={{ height: '40%' }}></div>
                                        <div className="w-1 bg-primary rounded-full animate-[wave_1s_ease-in-out_infinite_0.1s]" style={{ height: '70%' }}></div>
                                        <div className="w-1 bg-primary rounded-full animate-[wave_1s_ease-in-out_infinite_0.2s]" style={{ height: '100%' }}></div>
                                        <div className="w-1 bg-primary rounded-full animate-[wave_1s_ease-in-out_infinite_0.1s]" style={{ height: '60%' }}></div>
                                        <div className="w-1 bg-primary rounded-full animate-[wave_1s_ease-in-out_infinite_0.3s]" style={{ height: '80%' }}></div>
                                    </div>

                                    <div className="flex-1 text-gray-600 truncate font-medium">
                                        {transcript + interimTranscript || 'Ouvindo...'}
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    placeholder="Pergunte ao assistente... (Cole imagens com Ctrl+V)"
                                    rows={1}
                                    className="flex-1 py-3 bg-transparent resize-none focus:outline-none text-gray-800 placeholder:text-gray-400 max-h-[200px]"
                                    disabled={isLoading || isUploading}
                                />
                            )}

                            {/* Microphone Button */}
                            {isVoiceSupported && (
                                <button
                                    onClick={toggleListening}
                                    className={`
                                        p-2 mb-[2px] rounded-full transition-all duration-200
                                        ${isListening
                                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                                        }
                                    `}
                                    title={isListening ? 'Parar gravação' : 'Gravar áudio'}
                                    disabled={isLoading || isUploading}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                            )}

                            {/* Send button */}
                            <button
                                onClick={() => handleSend()}
                                disabled={(!input.trim() && selectedFiles.length === 0) || isLoading || isUploading}
                                className={`
                                p-2 mb-[2px] rounded-full transition-colors
                                ${(input.trim() || selectedFiles.length > 0) && !isLoading && !isUploading
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                            `}
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-2">
                            Godin usa IA para gerar respostas. Verifique informações importantes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Document Panel */}
            <DocumentPanel
                isOpen={documentPanel.isOpen}
                document={documentPanel.document}
                onClose={() => setDocumentPanel({ isOpen: false, document: undefined })}
            />
        </div>
    );
}

// =============================================
// Icon Components
// =============================================

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function MicrophoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    );
}

function ArrowUpIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
