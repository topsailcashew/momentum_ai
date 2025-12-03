'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Church } from 'lucide-react';

export function MinistrySelector() {
  const { ministries, selectedMinistryId, setSelectedMinistryId } = useDashboardData();

  if (ministries.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Church className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedMinistryId || 'all'}
        onValueChange={(value) => setSelectedMinistryId(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Ministries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Ministries</SelectItem>
          {ministries.map((ministry) => (
            <SelectItem key={ministry.id} value={ministry.id}>
              {ministry.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
