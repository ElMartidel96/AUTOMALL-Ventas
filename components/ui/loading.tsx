/**
 * Loading components for better UX
 * Provides consistent loading states across the application
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-700 rounded mb-2 last:mb-0" />
      ))}
    </div>
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  loading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function LoadingButton({ 
  children, 
  loading, 
  disabled, 
  onClick, 
  className = '',
  variant = 'primary'
}: LoadingButtonProps) {
  const baseClasses = "relative w-full font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </button>
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-8 w-8 bg-gray-700 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = 'Loading...', className = '' }: LoadingOverlayProps) {
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-6 mx-4 max-w-sm w-full">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-white text-sm sm:text-base">{message}</span>
        </div>
      </div>
    </div>
  );
}