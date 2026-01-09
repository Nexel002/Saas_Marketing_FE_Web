/**
 * Chat API Service
 * 
 * Handles chat-related API calls including SSE streaming.
 * Based on backend: src/routes/chat.routes.ts
 * 
 * Endpoints:
 * - POST /api/v1/chat/message - Enviar mensagem (SSE streaming)
 * - GET /api/v1/chat/conversations - Listar conversas
 * - POST /api/v1/chat/conversations - Criar conversa
 * - GET /api/v1/chat/conversations/:id - Obter conversa
 * - DELETE /api/v1/chat/conversations/:id - Eliminar conversa
 */

import { getToken } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// =============================================
// Types
// =============================================

export interface Conversation {
    _id: string;
    user_id: string;
    business_id?: string;
    title: string;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: ToolCall[];
    timestamp: string;
}

export interface ToolCall {
    name: string;
    args: Record<string, any>;
    result?: any;
}

export interface ConversationSummary {
    _id: string;
    title: string;
    created_at: string;
    updated_at: string;
    lastMessage?: string;
}

export interface SSEEvent {
    event: 'start' | 'chunk' | 'token' | 'tool_call' | 'tool_result' | 'document' | 'done' | 'error';
    data: any;
}

// =============================================
// Chat Service
// =============================================

export const chatService = {
    /**
     * Get all conversations for the user
     * GET /api/v1/chat/conversations
     */
    async getConversations(page = 1, limit = 20): Promise<ConversationSummary[]> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.data || [];
        } catch {
            return [];
        }
    },

    /**
     * Get a specific conversation by ID
     * GET /api/v1/chat/conversations/:id
     */
    async getConversation(conversationId: string): Promise<Conversation | null> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations/${conversationId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return data.data;
        } catch {
            return null;
        }
    },

    /**
     * Create a new conversation
     * POST /api/v1/chat/conversations
     */
    async createConversation(title?: string, businessId?: string): Promise<Conversation | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ title, businessId }),
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.data;
        } catch {
            return null;
        }
    },

    /**
     * Send a message and receive SSE streaming response
     * POST /api/v1/chat/message
     * 
     * SSE Events:
     * - start: { conversationId }
     * - chunk: text content
     * - tool_call: { name, args }
     * - tool_result: { name, result }
     * - done: { messageId, conversationId, toolsUsed }
     * - error: { error }
     */
    async *sendMessage(
        message: string,
        conversationId?: string
    ): AsyncGenerator<SSEEvent> {
        const token = getToken();
        console.log('[Chat] Sending message to API:', { message, conversationId, hasToken: !!token });
        console.log('[Chat] API URL:', `${API_BASE_URL}/chat/message`);

        try {
            const response = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message,
                    conversationId,
                }),
            });

            console.log('[Chat] Response status:', response.status, response.statusText);
            console.log('[Chat] Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Chat] Error response:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            // Check if response is SSE
            const contentType = response.headers.get('content-type') || '';
            console.log('[Chat] Content-Type:', contentType);

            // Handle non-streaming JSON response (fallback)
            if (contentType.includes('application/json')) {
                console.log('[Chat] Received JSON response instead of SSE');
                const data = await response.json();
                console.log('[Chat] JSON data:', data);

                // Emit as if it were SSE events
                yield { event: 'start', data: { conversationId: data.conversationId || data.data?.conversationId } };

                const content = data.response || data.message || data.data?.response || data.data?.message || '';
                if (content) {
                    yield { event: 'chunk', data: { content } };
                }

                yield { event: 'done', data: { toolsUsed: data.toolsUsed || [] } };
                return;
            }

            // SSE streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentEvent = 'chunk';
            let eventsReceived = 0;

            console.log('[Chat] Starting SSE stream reading...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('[Chat] Stream ended, total events received:', eventsReceived);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                console.log('[Chat] Raw chunk received:', chunk);
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    console.log('[Chat] Processing line:', trimmedLine);

                    if (trimmedLine.startsWith('event:')) {
                        currentEvent = trimmedLine.slice(6).trim();
                        console.log('[Chat] Event type:', currentEvent);
                    } else if (trimmedLine.startsWith('data:')) {
                        const dataStr = trimmedLine.slice(5).trim();
                        if (dataStr) {
                            eventsReceived++;
                            try {
                                const data = JSON.parse(dataStr);
                                console.log('[Chat] Parsed JSON data:', { event: currentEvent, data });
                                yield {
                                    event: currentEvent as SSEEvent['event'],
                                    data
                                };
                            } catch {
                                // Plain text (for chunk events)
                                console.log('[Chat] Plain text data:', { event: currentEvent, data: dataStr });
                                yield {
                                    event: currentEvent as SSEEvent['event'],
                                    data: dataStr
                                };
                            }
                        }
                    } else if (trimmedLine && !trimmedLine.startsWith(':')) {
                        // Some SSE implementations send data without 'data:' prefix
                        console.log('[Chat] Non-standard line:', trimmedLine);
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                console.log('[Chat] Remaining buffer:', buffer);
            }

        } catch (error: any) {
            console.error('[Chat] Error:', error);
            yield { event: 'error', data: { error: error.message } };
        }
    },

    /**
     * Delete a conversation
     * DELETE /api/v1/chat/conversations/:id
     */
    async deleteConversation(conversationId: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations/${conversationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Rename a conversation
     * PATCH /api/v1/chat/conversations/:id
     */
    async renameConversation(conversationId: string, title: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations/${conversationId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ title }),
                }
            );

            return response.ok;
        } catch {
            return false;
        }
    },
};

export default chatService;
