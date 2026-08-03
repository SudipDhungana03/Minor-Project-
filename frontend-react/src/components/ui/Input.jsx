import React from 'react';

/**
 * Clean, professional text input with optional label and helper/error text.
 */
const Input = ({
  label,
  id,
  error,
  helper,
  className = '',
  ...rest
}) => {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink-muted mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-ink placeholder:text-slate-400
          transition-all duration-200 outline-none
          ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]'
              : 'border-slate-200 focus:border-brand-500 focus:shadow-ring'
          }
          ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-rose-600">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-sm text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
};

export default Input;
