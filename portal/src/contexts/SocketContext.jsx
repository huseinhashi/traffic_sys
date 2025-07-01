import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket.IO connection
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketInstance = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true
    });

    // Socket event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Set the socket instance
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  // Socket context value
  const value = {
    socket,
    isConnected,
    // Helper methods for common socket operations
    subscribeToEvent: (event, callback) => {
      if (!socket) return () => {};
      socket.on(event, callback);
      return () => socket.off(event, callback);
    },
    emitEvent: (event, data) => {
      if (!socket) return;
      socket.emit(event, data);
    }
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}; 