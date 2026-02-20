export type TeamSocialKey =
  | 'twitter'
  | 'linkedin'
  | 'discord'
  | 'github'
  | 'telegram'
  | 'youtube';

export interface TeamMemberStats {
  tasksCompleted: number;
  reputation: number;
  respect: number;
  rank: string;
  contributions: number;
}

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  description: string;
  wallet: string;
  imageSrc?: string;
  videoSrc?: string;
  socials: Partial<Record<TeamSocialKey, string>>;
  stats: TeamMemberStats;
}
