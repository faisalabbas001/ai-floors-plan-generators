/**
 * WebSocket Client Service
 * Provides real-time collaboration events via Socket.IO
 */

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-floors-plan-backed-production.up.railway.app';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  /**
   * Connect to the WebSocket server
   * @param token JWT auth token
   */
  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Re-register all listeners
    for (const [event, callbacks] of this.listeners) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Join a project room for real-time collaboration
   */
  joinProject(projectId: number | string) {
    this.socket?.emit('join-project', projectId);
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId: number | string) {
    this.socket?.emit('leave-project', projectId);
  }

  /**
   * Broadcast plan update to collaborators
   */
  emitPlanUpdate(projectId: number | string, changes: unknown) {
    this.socket?.emit('plan-updated', { projectId, changes });
  }

  /**
   * Broadcast cursor position
   */
  emitCursorMove(projectId: number | string, position: { x: number; y: number }) {
    this.socket?.emit('cursor-move', { projectId, position });
  }

  /**
   * Listen for events
   */
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: unknown[]) => void) {
    this.listeners.get(event)?.delete(callback);

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Listen for collaborator joining
   */
  onUserJoined(callback: (data: { userId: number; email: string; timestamp: string }) => void) {
    this.on('user-joined', callback as (...args: unknown[]) => void);
  }

  /**
   * Listen for collaborator leaving
   */
  onUserLeft(callback: (data: { userId: number; email: string; timestamp: string }) => void) {
    this.on('user-left', callback as (...args: unknown[]) => void);
  }

  /**
   * Listen for plan changes from collaborators
   */
  onPlanChanged(callback: (data: { userId: number; email: string; changes: unknown; timestamp: string }) => void) {
    this.on('plan-changed', callback as (...args: unknown[]) => void);
  }

  /**
   * Listen for collaborator cursor movement
   */
  onCollaboratorCursor(callback: (data: { userId: number; email: string; position: { x: number; y: number } }) => void) {
    this.on('collaborator-cursor', callback as (...args: unknown[]) => void);
  }

  /**
   * Listen for Revit generation status updates
   */
  onRevitStatus(callback: (data: { workItemId: string; status: string; files?: unknown; timestamp: string }) => void) {
    this.on('revit-status', callback as (...args: unknown[]) => void);
  }

  /**
   * Listen for collaboration changes (member added/removed)
   */
  onCollaborationChange(callback: (data: { action: string; timestamp: string; [key: string]: unknown }) => void) {
    this.on('collaboration-change', callback as (...args: unknown[]) => void);
  }
}

// Singleton instance
export const socketClient = new SocketClient();
