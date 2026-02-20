/**
 * useAvatar - Hook for managing user avatar state
 *
 * Features:
 * - Fetch current avatar from API/storage
 * - Upload new avatar (video or image)
 * - Remove avatar
 * - Local storage caching
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useCallback, useEffect } from 'react';

interface AvatarState {
  videoSrc?: string;
  imageSrc?: string;
  type: 'video' | 'image' | null;
}

interface UseAvatarReturn {
  avatar: AvatarState;
  isLoading: boolean;
  error: string | null;
  upload: (file: File, type: 'video' | 'image') => Promise<string>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'cgc-avatar';

export function useAvatar(walletAddress?: string): UseAvatarReturn {
  const [avatar, setAvatar] = useState<AvatarState>({
    type: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load avatar from local storage on mount
  useEffect(() => {
    if (!walletAddress) return;

    const stored = localStorage.getItem(`${STORAGE_KEY}-${walletAddress}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAvatar(parsed);
      } catch {
        // Invalid stored data
      }
    }
  }, [walletAddress]);

  // Save avatar to local storage when it changes
  useEffect(() => {
    if (!walletAddress) return;

    if (avatar.type) {
      localStorage.setItem(
        `${STORAGE_KEY}-${walletAddress}`,
        JSON.stringify(avatar)
      );
    } else {
      localStorage.removeItem(`${STORAGE_KEY}-${walletAddress}`);
    }
  }, [avatar, walletAddress]);

  const upload = useCallback(async (file: File, type: 'video' | 'image'): Promise<string> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', walletAddress);

      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();

      // Update avatar state
      setAvatar({
        videoSrc: type === 'video' ? data.url : undefined,
        imageSrc: type === 'image' ? data.url : undefined,
        type,
      });

      return data.url;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const remove = useCallback(async (): Promise<void> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/avatar/upload?wallet=${walletAddress}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      // Clear avatar state
      setAvatar({ type: null });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const refresh = useCallback(async (): Promise<void> => {
    // For now, just reload from local storage
    // In future, could fetch from API/blockchain
    if (!walletAddress) return;

    const stored = localStorage.getItem(`${STORAGE_KEY}-${walletAddress}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAvatar(parsed);
      } catch {
        setAvatar({ type: null });
      }
    }
  }, [walletAddress]);

  return {
    avatar,
    isLoading,
    error,
    upload,
    remove,
    refresh,
  };
}

export default useAvatar;
