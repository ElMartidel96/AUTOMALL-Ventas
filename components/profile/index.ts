/**
 * Profile Components - 4-Level Profile Identity System
 *
 * Export barrel for profile card system.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

// Main component
export { ProfileCard, default as ProfileCardDefault } from './ProfileCard';

// Provider and context
export {
  ProfileCardProvider,
  useProfileCard,
  type ProfileLevel,
  type ProfileData,
} from './ProfileCardProvider';

// Individual level components (for advanced usage)
export { ProfileThumbnail } from './ProfileThumbnail';
export { ProfileExpanded } from './ProfileExpanded';
export { ProfileMiniCard } from './ProfileMiniCard';
export { ProfileFullCard } from './ProfileFullCard';

// Cross-platform integration components
export { WalletMiniCard } from './WalletMiniCard';
