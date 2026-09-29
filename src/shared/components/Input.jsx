import clsx from 'clsx';
import { forwardRef } from 'react';

/**
 * Styled input component with label and error message.
 */
export const Input = forwardRef(function Input(
  { label, error, className = '', id, required, hint, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-dark-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-required={required || undefined}
        className={clsx(
          'w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
          error
            ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-400'
            : 'border-dark-300 bg-white text-dark-900 placeholder-dark-400 hover:border-dark-400',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-dark-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

export default Input;
