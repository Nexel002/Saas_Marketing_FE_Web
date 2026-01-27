import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL!, {
            auth: {
                token: localStorage.getItem('authToken')
            }
        });

        newSocket.on('connect', () => {
            console.log('WebSocket conectado');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket desconectado');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return { socket, isConnected };
};
