import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Professional, reusable Button.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger'
 *  - size: 'sm' | 'md' | 'lg'
 *  - to: if provided renders a react-router <Link>
 *  - as: 'button' | 'a' (defaults to button unless `to` is set)
 *  - fullWidth: boolean
 */
const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ' +
  'focus:outline-none focus-visible:shadow-ring disabled:opacity-60 disabled:cursor-not-allowed select-none';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-lift active:scale-[0.98]',
  secondary:
    'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink-muted hover:bg-slate-100 hover:text-ink active:scale-[0.98]',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft hover:shadow-lift active:scale-[0.98]',
  warning:
    'bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-soft hover:shadow-lift active:scale-[0.98]',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-soft hover:shadow-lift active:scale-[0.98]',
};

const sizes = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  to,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) => {
  const classes = `${base} ${variants[variant] || variants.primary} ${
    sizes[size] || sizes.md
  } ${fullWidth ? 'w-full' : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
