import { create } from 'zustand';

export interface Message {
  msgId:  string;
  sender: 'a' | 'b' | 'system';
  text:   string;
  sentAt: string;
  type:   'text' | 'system';
}

interface ChatState {
  messages:    Message[];
  isTyping:    boolean;
  expiresAt:   string | null;
  addMessage:  (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setTyping:   (v: boolean) => void;
  setExpiry:   (at: string) => void;
  clearChat:   () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages:    [],
  isTyping:    false,
  expiresAt:   null,
  addMessage:  (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  setTyping:   (isTyping) => set({ isTyping }),
  setExpiry:   (expiresAt) => set({ expiresAt }),
  clearChat:   () => set({ messages: [], isTyping: false, expiresAt: null }),
}));
