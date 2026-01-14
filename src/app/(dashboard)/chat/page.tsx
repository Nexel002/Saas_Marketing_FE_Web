'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, Button, MediaCarousel, ContentGalleryModal, MediaItem } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, SSEEvent, assetsService, businessService } from '@/lib/api';
import { DocumentPanel } from '@/components/chat/DocumentPanel';
import { DocumentPanelState, Document } from '@/types/document';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

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
    documents?: Document[];
    uploadedImages?: Array<{ url: string; name: string; driveLink?: string }>;
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
                    // Avoid duplicating if the text was already added
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

            // Check limit
            if (selectedFiles.length + files.length > 5) {
                setUploadError('Máximo de 5 imagens permitido.');
                return;
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate type
                if (!allowedTypes.includes(file.type)) {
                    setUploadError(`Tipo de arquivo não suportado: ${file.name}. Use JPEG, PNG, GIF ou WebP.`);
                    continue;
                }

                // Validate size
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
        // Reset input
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

    // Handle paste event for images (like Gemini/ChatGPT)
    const handlePaste = (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const newFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Check if item is an image
            if (item.type.startsWith('image/')) {
                event.preventDefault();

                const file = item.getAsFile();
                if (!file) continue;

                // Check limit
                if (selectedFiles.length + newFiles.length >= 5) {
                    setUploadError('Máximo de 5 imagens permitido.');
                    break;
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    continue;
                }

                // Validate file size (10MB max)
                if (file.size > 10 * 1024 * 1024) {
                    continue;
                }

                // Generate a friendly name for pasted images
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                const extension = file.type.split('/')[1] || 'png';
                // Add index to timestamp to avoid name collision if multiple pasted at once
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

        // Process uploads if any
        let uploadedImagesData: Array<{ url: string; name: string; driveLink?: string }> = [];

        if (hasFiles) {
            if (!businessId) {
                setUploadError('Erro: ID do negócio não encontrado. Recarregue a página.');
                return;
            }

            setIsUploading(true);
            try {
                // Upload files sequentially to prevent server concurrency issues
                let successCount = 0;
                let failCount = 0;

                for (const file of selectedFiles) {
                    try {
                        const result = await uploadSingleFile(file);
                        if (result) {
                            uploadedImagesData.push(result);
                            successCount++;
                        } else {
                            failCount++;
                            console.error(`Falha no upload do arquivo: ${file.name}`);
                        }
                    } catch (innerError) {
                        failCount++;
                        console.error(`Exceção no upload de ${file.name}:`, innerError);
                    }
                }

                // If everything failed
                if (successCount === 0) {
                    setUploadError(`Falha no upload. Todas as ${selectedFiles.length} imagens falharam.`);
                    setIsUploading(false);
                    return;
                }

                // If partial failure, we proceed with what succeeded but could warn user
                // For now, we proceed silently with successful ones, or could append a note to content.

            } catch (err: any) {
                console.error('Error uploading batch:', err);
                setUploadError(`Erro crítico ao enviar imagens: ${err.message || 'Erro desconhecido'}`);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        // Determine final content for the user message
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
        setSelectedFiles([]); // Clear files after sending
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
                        // Document generated - open panel automatically AND save to message
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

                            // Open panel
                            setDocumentPanel({
                                isOpen: true,
                                document: doc
                            });

                            // Add to message state for persistent access
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
                            PromoMo usa IA para gerar respostas. Verifique informações importantes.
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
// Helper Functions
// =============================================

/**
 * Convert technical tool names to user-friendly action descriptions
 */
const getToolFriendlyName = (toolName: string): string => {
    const toolMap: Record<string, string> = {
        'describe_business': 'a registar o seu negócio',
        'get_business_info': 'a obter informações do negócio',
        'update_business': 'a atualizar o negócio',
        'run_market_research': 'a fazer pesquisa de mercado',
        'get_market_research': 'a obter pesquisa de mercado',
        'run_strategic_plan': 'a criar plano estratégico',
        'get_strategic_plan': 'a obter plano estratégico',
        'generate_campaign': 'a criar campanha de marketing',
        'list_campaigns': 'a listar campanhas',
        'get_campaign': 'a obter detalhes da campanha',
        'generate_content': 'a gerar conteúdo',
        'generate_campaign_contents': 'a gerar conteúdos da campanha',
        'generate_campaign_images': 'a gerar imagens da campanha',
        'generate_campaign_videos': 'a gerar vídeos da campanha',
        'list_campaign_contents': 'a listar conteúdos da campanha',
        'list_all_business_content': 'a listar todos os conteúdos',
        'list_generated_content': 'a listar conteúdos gerados',
        'get_drive_links': 'a obter links do Google Drive',
    };

    return toolMap[toolName] || `a executar ${toolName.replace(/_/g, ' ')}`;
};

/**
 * Remove MongoDB ObjectIds and other technical IDs from text
 */
const sanitizeContent = (content: string): string => {
    if (!content) return content;

    // Remove internal SYSTEM messages (like User ID injection)
    // Using [\s\S] instead of . with 's' flag for cross-line matching
    let sanitized = content.replace(/\[SYSTEM:[^\]]*\]/, '');

    // Remove MongoDB ObjectId patterns: (ID: 507f1f77bcf86cd799439011)
    sanitized = sanitized.replace(/\(ID:\s*[a-f0-9]{24}\s*\)/gi, '');

    // Remove standalone ObjectIds in parentheses
    sanitized = sanitized.replace(/\([a-f0-9]{24}\)/g, '');

    // Remove "ID: xxx" patterns
    sanitized = sanitized.replace(/ID:\s*[a-f0-9]{24}/gi, '');

    // Clean up any double spaces left behind (but preserve newlines)
    sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');

    return sanitized.trim();
};

// =============================================
// Sub-components
// =============================================

function MessageBubble({ message, userInitial, onViewDocument }: { message: Message; userInitial?: string; onViewDocument?: (doc: Document) => void }) {
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

                const contents = data.contents || (data.result && data.result.contents) || data.images || data.videos;

                if (Array.isArray(contents)) {
                    contents.forEach((item: any) => {
                        // Support various url property names
                        const originalUrl = item.driveLink || item.drive_web_link || item.url;

                        if (originalUrl) {
                            const displayUrl = formatUrlForDisplay(originalUrl);

                            if (!seenIds.has(originalUrl)) {
                                seenIds.add(originalUrl);

                                // Robust type detection
                                const itemType = (item.type || item.content_type || '').toLowerCase();
                                const isVideo = itemType === 'video' || itemType.includes('video') || itemType === 'mp4';

                                mediaItems.push({
                                    id: originalUrl,
                                    type: isVideo ? 'video' : 'image',
                                    url: displayUrl,
                                    title: item.title || item.name || item.content_name || 'Conteúdo Gerado',
                                    thumbnail: item.thumbnail
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

    // Extract documents from tool results for display
    const extractDocuments = (toolResults?: any[]): Document[] => {
        const docs: Document[] = [];
        const seenIds = new Set<string>();

        if (toolResults) {
            toolResults.forEach(result => {
                let data = result;
                if (typeof result === 'string') {
                    try { data = JSON.parse(result); } catch (e) { }
                }

                // Handle both single object and array results
                const items = Array.isArray(data) ? data :
                    (data.documents || data.campaigns || (data.campaign_name ? [data] : []));

                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const id = item.id || item._id;
                        const driveLink = item.driveLink || item.drive_link;

                        if (id && (driveLink || item.campaign_name || item.title)) {
                            let type = item.type;
                            if (!type) {
                                if (item.campaign_name) type = 'campaign';
                                else if (item.title?.toLowerCase().includes('pesquisa')) type = 'market_research';
                                else if (item.title?.toLowerCase().includes('plano')) type = 'strategic_plan';
                            }

                            if (type && !seenIds.has(id)) {
                                seenIds.add(id);
                                docs.push({
                                    id,
                                    type: type,
                                    title: item.title || item.campaign_name || 'Documento',
                                    content: item.content || item.description || '',
                                    driveLink: driveLink,
                                    pdfFileName: item.pdfFileName || item.pdf_file_name,
                                    createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
                                });
                            }
                        }
                    });
                }
            });
        }
        return docs;
    };

    const { cleanContent, mediaItems } = extractMedia(message.content, message.toolResultData);
    const extractedDocuments = extractDocuments(message.toolResultData);

    // Combine explicit message documents with extracted ones, avoiding duplicates
    const allDocuments = [...(message.documents || [])];
    extractedDocuments.forEach((doc: Document) => {
        if (!allDocuments.some(d => d.id === doc.id)) {
            allDocuments.push(doc);
        }
    });

    // Sanitize content to remove technical IDs
    const sanitizedContent = sanitizeContent(cleanContent);

    // Build a map of Drive Links -> Document Info from tool results
    const linkMap = new Map<string, { id: string; type: any; title: string }>();

    if (message.toolResultData) {
        message.toolResultData.forEach(result => {
            let data = result;
            if (typeof result === 'string') {
                try { data = JSON.parse(result); } catch (e) { }
            }

            // Check for documents list structure (from list_documents or list_campaigns)
            // Expecting array of objects with driveLink/drive_link and _id/id
            const items = Array.isArray(data) ? data :
                (data.documents || data.campaigns || data.contents || []);

            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    const link = item.driveLink || item.drive_link;
                    const id = item.id || item._id;
                    const type = item.type || (item.campaign_name ? 'campaign' : undefined);

                    if (link && id && type) {
                        // Normalize link (remove query params if needed, but usually exact match is best)
                        linkMap.set(link, { id, type, title: item.title || item.campaign_name || 'Documento' });
                    }
                });
            }
        });
    }

    if (isUser) {
        // Helper to convert Drive link to displayable URL
        const getDisplayUrl = (url: string): string => {
            const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch && driveMatch[1]) {
                return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
            }
            return url;
        };

        return (
            <div className="flex flex-col items-end mb-6 gap-2">
                {/* Uploaded Images */}
                {message.uploadedImages && message.uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-[85%] sm:max-w-[75%] justify-end">
                        {message.uploadedImages.map((img, idx) => (
                            <a
                                key={idx}
                                href={img.driveLink || img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors shadow-md"
                                title={`Ver: ${img.name}`}
                            >
                                <img
                                    src={getDisplayUrl(img.url)}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to placeholder on error
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zm0 2v10h16V7H4zm2 2h2v2H6V9zm4 0h8v2h-8V9zm-4 4h12v2H6v-2z"/></svg>';
                                    }}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">Ver imagem</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Text content */}
                <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{sanitizedContent}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                {/* Message Content */}
                <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-7 text-[15px]">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="font-medium text-gray-700">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-5 my-3 space-y-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-5 my-3 space-y-2">{children}</ol>,
                            li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold text-gray-900 mt-3 mb-2">{children}</h3>,
                            a: ({ href, children }) => {
                                if (!href) return <span>{children}</span>;

                                // 1. Check if we have a direct mapping for this link
                                const mappedDoc = linkMap.get(href);
                                if (mappedDoc && onViewDocument) {
                                    return (
                                        <button
                                            onClick={() => onViewDocument({
                                                id: mappedDoc.id,
                                                type: mappedDoc.type,
                                                title: mappedDoc.title,
                                                content: '', // Content will be fetched by Panel
                                                driveLink: href,
                                                createdAt: new Date()
                                            })}
                                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors text-left inline-block"
                                            title="Ver documento"
                                        >
                                            {children}
                                        </button>
                                    );
                                }

                                // 2. Check for PDF/Drive links specific patterns used in this app (Fallback)
                                const isPdf = href?.toLowerCase().includes('.pdf') ||
                                    href?.includes('drive.google.com') ||
                                    href?.includes('docs.google.com');

                                if (isPdf && onViewDocument) {
                                    return (
                                        <button
                                            onClick={() => onViewDocument({
                                                id: href,
                                                type: 'pdf_document', // Generic type for external PDF links
                                                title: String(children),
                                                content: '',
                                                driveLink: href,
                                                createdAt: new Date()
                                            })}
                                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors text-left inline-block"
                                            title="Ver documento"
                                        >
                                            {children}
                                        </button>
                                    );
                                }

                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                        {children}
                                    </a>
                                );
                            },
                            code: ({ children }) => (
                                <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                            ),
                            pre: ({ children }) => (
                                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm my-3">{children}</pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic text-gray-600 my-3 bg-gray-50/50 rounded-r">{children}</blockquote>
                            ),
                            hr: () => <hr className="my-4 border-gray-200" />,
                        }}
                    >
                        {sanitizedContent || '...'}
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

                {/* Generated Documents (PDFs) */}
                {allDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {allDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl max-w-sm">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                                    <p className="text-xs text-gray-500">Documento PDF</p>
                                </div>
                                <button
                                    onClick={() => onViewDocument?.(doc)}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors shadow-sm"
                                >
                                    Ver PDF
                                </button>
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
