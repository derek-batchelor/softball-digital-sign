import { io, Socket } from 'socket.io-client';
import { SessionChangeEvent } from '@shared/types';
import { config } from '../config';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(config.wsUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onSessionChange(callback: (event: SessionChangeEvent) => void) {
    if (!this.socket) return;
    this.socket.on('session-change', callback);
  }

  onContentUpdate(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('content-update', callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const wsService = new WebSocketService();
