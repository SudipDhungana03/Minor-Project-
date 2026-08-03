import React from 'react';

/**
 * Friendly empty-state placeholder for lists with no data.
 */
const EmptyState = ({ icon = '📭', title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 ${className}`}
  >
    <div className="text-4xl mb-3" aria-hidden>
      {icon}
    </div>
    {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
    {description && (
      <p className="mt-1.5 text-sm text-ink-soft max-w-md">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
