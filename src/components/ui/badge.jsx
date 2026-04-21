import React from 'react';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Badge({ className = '', variant = 'default', ...props }) {
  const variantClass = variant === 'outline'
    ? 'border border-neutral-300 bg-white text-neutral-700'
    : 'border border-transparent bg-neutral-900 text-white';
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClass, className)} {...props} />;
}
