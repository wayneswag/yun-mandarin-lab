import React from 'react';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Card({ className = '', ...props }) {
  return <div className={cn('bg-white text-neutral-900', className)} {...props} />;
}

export function CardHeader({ className = '', ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardTitle({ className = '', ...props }) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardContent({ className = '', ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}
