import { useProductTypes } from '../../../shared/hooks/useProductTypes';

export function ProductBadge({ type, className = '' }) {
  const { types } = useProductTypes();
  const typeData = types.find((t) => t.slug === type);
  const color = typeData?.color ?? '#6b7280';
  const label = typeData?.name ?? type;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

export default ProductBadge;
