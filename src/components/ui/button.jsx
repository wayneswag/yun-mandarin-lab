import React from 'react';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Button({ className = '', variant = 'default', size = 'default', ...props }) {
  const variantClass = {
    default: 'bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900',
    outline: 'bg-white text-neutral-900 hover:bg-neutral-100 border border-neutral-300',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 border border-transparent',
  }[variant] || 'bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900';

  const sizeClass = {
    default: 'h-10 px-4 py-2 text-sm',
    icon: 'h-10 w-10 p-0',
  }[size] || 'h-10 px-4 py-2 text-sm';

  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50', variantClass, sizeClass, className)}
      {...props}
    />
  );
}
