'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Store, CheckCircle, ShoppingCart, Search } from 'lucide-react';
import type { UserRole } from '@/lib/types/user';

const ROLE_CONFIG: { role: UserRole; icon: typeof ShoppingCart }[] = [
  { role: 'buyer', icon: ShoppingCart },
  { role: 'seller', icon: Store },
  { role: 'birddog', icon: Search },
];

export function RoleChanger({
  currentRole,
  onChangeRole,
}: {
  currentRole: UserRole | null;
  onChangeRole: (role: UserRole) => Promise<void>;
}) {
  const tRoles = useTranslations('roles');
  const [isChanging, setIsChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!currentRole) return null;

  const handleChange = async (newRole: UserRole) => {
    if (newRole === currentRole || isChanging) return;
    setIsChanging(true);
    setSuccess(false);
    try {
      await onChangeRole(newRole);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Error handled upstream
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {tRoles('currentRole')}
        </h3>
        {success && (
          <span className="text-sm text-am-green flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {tRoles('changeSuccess')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROLE_CONFIG.map(({ role, icon: Icon }) => {
          const isActive = role === currentRole;
          return (
            <button
              key={role}
              onClick={() => handleChange(role)}
              disabled={isChanging}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                isActive
                  ? 'border-am-orange bg-am-orange/10 dark:bg-am-orange/15'
                  : 'border-gray-200 dark:border-gray-700 hover:border-am-orange/50 bg-white/50 dark:bg-white/5'
              } disabled:opacity-50`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-am-orange' : 'text-gray-400'}`} />
              <p className={`text-xs font-bold ${isActive ? 'text-am-orange' : 'text-gray-600 dark:text-gray-300'}`}>
                {tRoles(`${role}.label`)}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">{tRoles('roleNote')}</p>
    </div>
  );
}
