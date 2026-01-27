import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

export const useChatAgent = () => {
    const { socket, isConnected } = useWebSocket();
    const [messages, setMessages] = useState<any[]>([]); // User used any[], sticking to it for now but should be typed ideally
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat:response', (response) => {
            setMessages(prev => [...prev, response]);
        });

        socket.on('chat:typing', ({ isTyping }: { isTyping: boolean }) => {
            setIsTyping(isTyping);
        });

        return () => {
            socket.off('chat:response');
            socket.off('chat:typing');
        };
    }, [socket]);

    const sendMessage = (message: string) => {
        if (!socket) return;

        // Warning: 'current-user-id' is hardcoded as per user request snippet. 
        // In a real app this should come from auth context.
        const messageData = {
            messageId: Date.now(),
            userId: 'current-user-id',
            message
        };

        socket.emit('chat:message', messageData);
        setMessages(prev => [...prev, { type: 'user', content: message }]);
    };

    return { messages, isTyping, sendMessage, isConnected };
};
