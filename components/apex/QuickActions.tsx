'use client';

/**
 * QuickActions - Action buttons for ApexPanel
 *
 * Provides quick access to:
 * - Send Gift
 * - View Tasks
 * - Share Referral
 * - View Profile
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Send,
  ClipboardList,
  Share2,
  User,
  ExternalLink,
  QrCode,
} from 'lucide-react';

interface QuickActionsProps {
  onClose: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

function ActionButton({
  icon,
  label,
  description,
  href,
  onClick,
  variant = 'secondary',
  external = false,
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  const content = (
    <div
      className={`
        flex items-center gap-3
        p-3 rounded-xl
        transition-all duration-200
        ${isPrimary
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
          : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700'
        }
      `}
    >
      <div
        className={`
          p-2 rounded-lg
          ${isPrimary
            ? 'bg-white/20'
            : 'bg-gray-100 dark:bg-slate-700'
          }
        `}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div
          className={`
            font-medium text-sm
            ${isPrimary ? 'text-white' : 'text-gray-900 dark:text-white'}
          `}
        >
          {label}
        </div>
        <div
          className={`
            text-xs
            ${isPrimary ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}
          `}
        >
          {description}
        </div>
      </div>
      {external && (
        <ExternalLink
          className={`
            w-4 h-4
            ${isPrimary ? 'text-white/60' : 'text-gray-400'}
          `}
        />
      )}
    </div>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick}>
      {content}
    </Link>
  );
}

export function QuickActions({ onClose }: QuickActionsProps) {
  const t = useTranslations('apex');

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Quick Actions
      </h3>

      <div className="space-y-2">
        {/* Primary Action - Send Gift */}
        <ActionButton
          icon={<Send className="w-5 h-5 text-white" />}
          label="Send Gift"
          description="Gift CGC tokens to friends"
          href="/gifts/send"
          onClick={onClose}
          variant="primary"
        />

        {/* Secondary Actions */}
        <ActionButton
          icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
          label="View Tasks"
          description="Complete tasks to earn CGC"
          href="/tasks"
          onClick={onClose}
        />

        <ActionButton
          icon={<Share2 className="w-5 h-5 text-green-500" />}
          label="Share Referral"
          description="Invite friends & earn rewards"
          href="/referrals"
          onClick={onClose}
        />

        <ActionButton
          icon={<User className="w-5 h-5 text-purple-500" />}
          label="My Profile"
          description="View and edit your profile"
          href="/profile"
          onClick={onClose}
        />
      </div>
    </div>
  );
}

export default QuickActions;
