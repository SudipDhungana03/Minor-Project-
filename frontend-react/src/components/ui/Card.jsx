import React from 'react';

/**
 * Reusable surface / card container.
 *
 * Props:
 *  - hover: adds a subtle lift on hover (good for clickable cards)
 *  - padded: toggles default padding (default true)
 */
const Card = ({ hover = false, padded = true, className = '', children, ...rest }) => {
  const classes =
    'bg-white border border-slate-200/80 rounded-2xl shadow-card ' +
    (padded ? 'p-6 ' : '') +
    (hover
      ? 'transition-all duration-200 hover:shadow-lift hover:-translate-y-1 '
      : '') +
    className;

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
