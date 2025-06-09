"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketHookOptions {
  url?: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  shouldReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketHookReturn {
  socket: WebSocket | null;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  sendMessage: (message: WebSocketMessage) => void;
  sendJsonMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
}

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;
const READY_STATE_CLOSING = 2;
const READY_STATE_CLOSED = 3;

export const useWebSocket = (
  url: string,
  options: WebSocketHookOptions = {}
): WebSocketHookReturn => {
  const {
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    shouldReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(READY_STATE_CLOSED);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const socketRef = useRef<WebSocket | null>(null);
  const urlRef = useRef(url);

  // Update URL ref when URL changes
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === READY_STATE_OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(urlRef.current, protocols);
      socketRef.current = ws;
      setSocket(ws);
      setReadyState(READY_STATE_CONNECTING);

      ws.onopen = (event) => {
        setReadyState(READY_STATE_OPEN);
        setConnectionAttempts(0);
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setReadyState(READY_STATE_CLOSED);
        setSocket(null);
        socketRef.current = null;
        onClose?.(event);

        // Attempt to reconnect if enabled and not manually closed
        if (
          shouldReconnect &&
          connectionAttempts < maxReconnectAttempts &&
          !event.wasClean
        ) {
          setConnectionAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          // Handle non-JSON messages
          const message = { type: 'raw', data: event.data };
          setLastMessage(message);
          onMessage?.(message);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setReadyState(READY_STATE_CLOSED);
    }
  }, [protocols, onOpen, onClose, onError, onMessage, shouldReconnect, reconnectInterval, maxReconnectAttempts, connectionAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === READY_STATE_OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  const sendJsonMessage = useCallback((message: any) => {
    if (socketRef.current?.readyState === READY_STATE_OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const isConnected = readyState === READY_STATE_OPEN;
  const isConnecting = readyState === READY_STATE_CONNECTING;

  return {
    socket,
    lastMessage,
    readyState,
    sendMessage,
    sendJsonMessage,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    connectionAttempts,
  };
}; 