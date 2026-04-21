import React from 'react';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Progress({ value = 0, className = '' }) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-neutral-200', className)}>
      <div className="h-full bg-neutral-900 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
