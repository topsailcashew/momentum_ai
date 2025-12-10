'use client';

import * as React from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { Team } from '@/types/team';

interface TeamContextValue {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  isLoading: boolean;
}

const TeamContext = React.createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = React.useState<Team | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setTeams([]);
      setCurrentTeam(null);
      setIsLoading(false);
      return;
    }

    // Wait until user is fully loaded before setting up listeners
    if (isUserLoading) {
      return;
    }

    // Listen to teams where user is a member
    const teamsRef = collection(firestore, 'teams');
    const q = query(
      teamsRef,
      where('members', 'array-contains', {
        userId: user.uid,
      })
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      setTeams(teamsData);

      // Auto-select first team if none selected
      if (teamsData.length > 0 && !currentTeam) {
        setCurrentTeam(teamsData[0]);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, firestore, isUserLoading]);

  return (
    <TeamContext.Provider
      value={{
        teams,
        currentTeam,
        setCurrentTeam,
        isLoading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = React.useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
