'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TeamMember } from '@/lib/team/types';
import { DEFAULT_TEAM_MEMBERS } from '@/lib/team/default-team';

interface TeamMembersState {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updateMember: (member: TeamMember) => void;
}

export function useTeamMembers(): TeamMembersState {
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/team');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load team members');
      }
      if (Array.isArray(data.data) && data.data.length > 0) {
        setMembers(data.data);
      } else {
        setMembers(DEFAULT_TEAM_MEMBERS);
      }
    } catch (err) {
      setMembers(DEFAULT_TEAM_MEMBERS);
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateMember = useCallback((updated: TeamMember) => {
    setMembers((prev) =>
      prev.map((member) => (member.wallet.toLowerCase() === updated.wallet.toLowerCase() ? updated : member))
    );
  }, []);

  return {
    members,
    isLoading,
    error,
    refresh: fetchMembers,
    updateMember,
  };
}
