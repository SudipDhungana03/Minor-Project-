import React from 'react';

/**
 * Shimmering loading placeholder. Use `className` to size it.
 */
const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`}
    aria-hidden
  />
);

/** Pre-composed card-shaped skeleton for grids. */
export const SkeletonCard = () => (
  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card p-6">
    <Skeleton className="h-5 w-2/3 mb-3" />
    <Skeleton className="h-4 w-1/2 mb-6" />
    <Skeleton className="h-10 w-32" />
  </div>
);

export default Skeleton;
