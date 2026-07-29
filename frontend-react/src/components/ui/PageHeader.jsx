import React from 'react';

/**
 * Consistent page title block with optional subtitle and right-aligned actions.
 */
const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <div
    className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 ${className}`}
  >
    <div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-ink-soft text-base max-w-2xl">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
