import clsx from 'clsx';
import { PRODUCT_TYPE } from '../../../shared/constants';

/**
 * Badge indicating product type: JASTIP (red) or PRELOVED (purple).
 */
export function ProductBadge({ type, className = '' }) {
  const isJastip = type === PRODUCT_TYPE.JASTIP;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide',
        isJastip
          ? 'bg-brand-100 text-brand-800'
          : 'bg-purple-100 text-purple-700',
        className
      )}
    >
      {isJastip ? 'Jastip' : 'Preloved'}
    </span>
  );
}

export default ProductBadge;
