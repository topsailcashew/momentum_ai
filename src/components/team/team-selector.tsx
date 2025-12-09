'use client';

import * as React from 'react';
import { useTeam } from '@/hooks/use-team';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Users, User } from 'lucide-react';

export function TeamSelector() {
  const { teams, currentTeam, setCurrentTeam } = useTeam();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {currentTeam ? (
            <>
              <Users className="size-4" />
              <span>{currentTeam.name}</span>
            </>
          ) : (
            <>
              <User className="size-4" />
              <span>Personal</span>
            </>
          )}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrentTeam(null)}>
          <User className="size-4" />
          <span>Personal</span>
        </DropdownMenuItem>
        {teams.length > 0 && <DropdownMenuSeparator />}
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => setCurrentTeam(team)}
          >
            <Users className="size-4" />
            <span>{team.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
