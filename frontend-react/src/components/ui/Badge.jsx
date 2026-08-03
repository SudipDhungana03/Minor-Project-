import React from 'react';

/**
 * Small status pill. variant: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
 */
const variants = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
};

const Badge = ({ variant = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
      variants[variant] || variants.neutral
    } ${className}`}
  >
    {children}
  </span>
);

export default Badge;
