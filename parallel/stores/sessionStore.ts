import { create } from 'zustand';

interface SessionState {
  sessionId:    string | null;
  status:       'idle' | 'selecting' | 'in_pool' | 'matched' | 'expired';
  matchId:      string | null;
  selectedTags: string[];
  setSession:   (id: string) => void;
  setStatus:    (s: SessionState['status']) => void;
  setMatchId:   (id: string | null) => void;
  setTags:      (tags: string[]) => void;
  reset:        () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId:    null,
  status:       'idle',
  matchId:      null,
  selectedTags: [],
  setSession:   (id) => set({ sessionId: id, status: 'selecting' }),
  setStatus:    (status) => set({ status }),
  setMatchId:   (matchId) => set({ matchId }),
  setTags:      (selectedTags) => set({ selectedTags }),
  reset:        () => set({ sessionId: null, status: 'idle', matchId: null, selectedTags: [] }),
}));
