import clsx from 'clsx';
import { formatCurrency } from '../../../shared/utils/format';

export function PriceCalculator({ price, fee, originalPrice }) {
  const p = parseFloat(price) || 0;
  const f = parseFloat(fee) || 0;
  const orig = parseFloat(originalPrice) || 0;
  const total = p + f;
  const isInvalid = orig > 0 && total > orig;

  if (p === 0 && f === 0) return null;

  return (
    <div className={clsx(
      'rounded-xl p-3 border text-sm space-y-1',
      isInvalid ? 'bg-red-50 border-red-300' : 'bg-dark-50 border-dark-200'
    )}>
      <div className="flex justify-between text-dark-600 text-xs">
        <span>Base Price</span>
        <span>{formatCurrency(p)}</span>
      </div>
      <div className="flex justify-between text-dark-600 text-xs">
        <span>Service Fee</span>
        <span>+ {formatCurrency(f)}</span>
      </div>
      {orig > 0 && (
        <div className="flex justify-between text-dark-400 text-xs">
          <span>Original Price</span>
          <span>{formatCurrency(orig)}</span>
        </div>
      )}
      <div className={clsx(
        'flex justify-between font-bold text-xs border-t pt-1 mt-1',
        isInvalid ? 'text-red-700 border-red-300' : 'text-dark-900 border-dark-200'
      )}>
        <span>Total to pay</span>
        <span>{formatCurrency(total)}</span>
      </div>
      {isInvalid && (
        <p className="text-xs text-red-600 font-medium pt-0.5">
          Total ({formatCurrency(total)}) exceeds Original Price ({formatCurrency(orig)}). Reduce Price or Fee.
        </p>
      )}
    </div>
  );
}

export default PriceCalculator;
