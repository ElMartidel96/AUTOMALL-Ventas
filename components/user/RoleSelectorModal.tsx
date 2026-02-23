'use client';

/**
 * RoleSelectorModal — First-login role picker
 *
 * Appears as a fullscreen modal when a connected wallet has no
 * record in the `users` table. Lets the user choose buyer / seller / birddog,
 * creates the user row, and redirects accordingly.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Store, Search, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import type { UserRole } from '@/lib/types/user';

const ROLE_OPTIONS: { role: UserRole; icon: typeof ShoppingCart }[] = [
  { role: 'buyer', icon: ShoppingCart },
  { role: 'seller', icon: Store },
  { role: 'birddog', icon: Search },
];

export function RoleSelectorModal() {
  const { isNewUser } = useUser();

  if (!isNewUser) return null;

  return <RoleSelectorContent />;
}

function RoleSelectorContent() {
  const router = useRouter();
  const t = useTranslations('roles');
  const { createUser } = useUser();
  const [selected, setSelected] = useState<UserRole>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const { needs_onboarding } = await createUser(selected);

      if (selected === 'buyer') {
        router.push('/catalog');
      } else if (needs_onboarding) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-crystal-enhanced rounded-3xl p-6 md:p-10 max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-300">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t('subtitle')}
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {ROLE_OPTIONS.map(({ role, icon: Icon }) => {
            const isSelected = selected === role;
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-am-orange bg-am-orange/10 dark:bg-am-orange/15 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-am-orange/50 bg-white/50 dark:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected
                    ? 'bg-am-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`font-bold text-sm ${
                  isSelected ? 'text-am-orange' : 'text-gray-900 dark:text-white'
                }`}>
                  {t(`${role}.label`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t(`${role}.description`)}
                </p>
                {role === 'buyer' && (
                  <span className="absolute top-2 right-2 text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {t('roleNote')}
        </p>

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-am-orange to-am-orange-light hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('continue')
          )}
        </button>
      </div>
    </div>
  );
}
