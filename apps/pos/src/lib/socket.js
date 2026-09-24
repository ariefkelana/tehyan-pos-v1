// File: apps/pos/src/lib/socket.js
/**
 * Socket.io singleton for the POS app.
 *
 * Importing this module from anywhere will always return
 * the same socket instance — no duplicate connections.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false, // Manually connect when needed
  reconnectionAttempts: 15,
  reconnectionDelay: 1500,
});

export default socket;
