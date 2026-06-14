/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 28,
  };

  return (
    <div className={`flex items-center gap-2 font-semibold text-slate-900 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
        <ShieldAlert size={iconSizes[size]} className="text-blue-500 animate-pulse" />
      </div>
      <div>
        <span className={`tracking-tight font-extrabold ${sizeClasses[size]}`}>
          Review<span className="text-blue-600">Rescue</span>
        </span>
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI</span>
      </div>
    </div>
  );
}
