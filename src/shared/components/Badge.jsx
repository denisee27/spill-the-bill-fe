import clsx from 'clsx';

/**
 * Reusable badge component.
 * @param {'gray'|'red'|'green'|'yellow'|'blue'|'purple'|'indigo'|'orange'|'teal'} color
 */
export function Badge({ children, color = 'gray', className = '' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    orange: 'bg-orange-100 text-orange-700',
    teal: 'bg-teal-100 text-teal-700',
    brand: 'bg-brand-100 text-brand-800',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        colors[color] || colors.gray,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
