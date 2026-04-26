import { io } from 'socket.io-client';

// Connect to same origin — Vite proxy forwards /socket.io to backend port 4000
// This works on both laptop (localhost:5173) and phone (192.168.x.x:5173)
const socket = io(window.location.origin, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

export default socket;