'use client';

import { Users } from 'lucide-react';
import { TeamMemberApex } from './TeamMemberApex';
import { useTeamMembers } from './useTeamMembers';

interface TeamSectionProps {
  badge: string;
  title: string;
  subtitle: string;
  contactEmail?: string;
}

export function TeamSection({
  badge,
  title,
  subtitle,
  contactEmail = 'admin@mbxarts.com',
}: TeamSectionProps) {
  const { members, updateMember } = useTeamMembers();

  return (
    <section className="relative py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl p-6 lg:p-8 glass-crystal border-l-4 border-l-purple-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-full mb-4">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {badge}
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {members.map((member) => (
              <TeamMemberApex
                key={member.wallet}
                member={member}
                onMemberUpdated={updateMember}
              />
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Official Contact:
              </span>
              <a
                href={`mailto:${contactEmail}`}
                className="text-sm text-purple-700 dark:text-purple-300 hover:underline font-mono"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
