import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { router } from 'expo-router';

export function useMatchSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { sessionId, matchId, setStatus } = useSessionStore();
  const { addMessage, setMessages, setTyping, setExpiry, clearChat } = useChatStore();

  useEffect(() => {
    if (!matchId || !sessionId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('match:join', { matchId, sessionId });
    });

    socket.on('chat:history', ({ messages, expiresAt }) => {
      setMessages(messages);
      setExpiry(expiresAt);
    });

    socket.on('chat:message', (msg) => {
      addMessage(msg);
    });

    socket.on('chat:typing', () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    socket.on('match:expiring', () => {
      addMessage({
        msgId:  'sys-expiring',
        sender: 'system',
        text:   'One hour left. This conversation dissolves soon.',
        sentAt: new Date().toISOString(),
        type:   'system',
      });
    });

    socket.on('match:ended', ({ reason }) => {
      clearChat();
      setStatus('expired');
      router.replace('/match/end');
    });

    socket.on('match:peer_disconnected', () => {
      addMessage({
        msgId:  'sys-disconnected',
        sender: 'system',
        text:   'Your parallel stepped away for a moment.',
        sentAt: new Date().toISOString(),
        type:   'system',
      });
    });

    return () => { socket.disconnect(); };
  }, [matchId, sessionId]);

  const sendMessage = (text: string) => {
    socketRef.current?.emit('chat:send', { text });
  };

  const sendTyping = () => {
    socketRef.current?.emit('chat:typing');
  };

  const leaveMatch = () => {
    socketRef.current?.emit('match:leave');
  };

  return { sendMessage, sendTyping, leaveMatch };
}
