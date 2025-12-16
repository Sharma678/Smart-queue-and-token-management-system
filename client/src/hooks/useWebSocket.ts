import { useEffect, useRef } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

export const useWebSocket = (onMessage: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          const newWs = new WebSocket(WS_URL);
          wsRef.current = newWs;
        }
      }, 3000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);
};

