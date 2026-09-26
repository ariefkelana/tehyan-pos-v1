import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'https://tehyan-pos-v1-backend.vercel.app/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API.replace(/\/api$/, '');

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnectionAttempts: 15,
  reconnectionDelay: 1500,
});

export default socket;
