import { Timestamp } from 'firebase/firestore';

export interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
  currentEnergy?: 'low' | 'medium' | 'high';
  isActive?: boolean; // Online in last 5 minutes
}

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  members: TeamMember[];
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
