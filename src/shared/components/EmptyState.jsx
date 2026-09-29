import { PackageSearch } from 'lucide-react';

/**
 * Empty state placeholder with icon and message.
 */
export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-up">
      <div className="w-16 h-16 rounded-full bg-dark-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-dark-400" />
      </div>
      <h3 className="text-lg font-semibold text-dark-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-dark-500 max-w-xs mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
