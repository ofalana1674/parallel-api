export type SessionStatus = 'selecting' | 'in_pool' | 'matched' | 'expired';

export interface Session {
  sessionId: string;
  createdAt: string;
  poolEntryAt: string | null;
  matchId: string | null;
  tagIds: string[];
  status: SessionStatus;
}

export interface Match {
  matchId: string;
  sessionA: string;
  sessionB: string;
  tagIds: string[];
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'ended';
}

export type TagVisibility = 'hidden' | 'muted' | 'normal' | 'pulse';

export interface TagPulse {
  tagId: string;
  activeCount: number;
  visibility: TagVisibility;
}
