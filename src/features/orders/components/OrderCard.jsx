import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatCurrency, formatDate, imageUrl } from '../../../shared/utils/format';
import { ORDER_STATUS_BAR_COLOR } from '../../../shared/constants';

export function OrderCard({ order }) {
  const items = order.orderItems || order.items || [];
  const itemCount = items.length;
  const firstItem = items[0];
  const firstProductName = firstItem?.product?.name || firstItem?.name || null;
  const extraCount = itemCount > 1 ? itemCount - 1 : 0;

  const rawImages = firstItem?.product?.images;
  let thumbSrc = null;
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    thumbSrc = imageUrl(rawImages[0]?.url || rawImages[0]);
  } else if (typeof rawImages === 'string') {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        thumbSrc = imageUrl(parsed[0]?.url || parsed[0]);
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const barColor = ORDER_STATUS_BAR_COLOR[order.status] || 'bg-dark-200';

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white rounded-xl border border-dark-200 overflow-hidden hover:border-brand-300 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      {/* Status color bar */}
      <div className={`h-1 w-full ${barColor}`} />

      <div className="flex items-center gap-3 p-4">
        {/* Thumbnail */}
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={firstProductName || 'Order item'}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-dark-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-dark-100 flex-shrink-0 flex items-center justify-center text-dark-300 text-2xl">
            ?
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Order number + status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-dark-700">
              #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Product name */}
          {firstProductName && (
            <p className="text-sm font-semibold text-dark-900 truncate">
              {firstProductName}
              {extraCount > 0 && (
                <span className="text-dark-400 font-normal"> +{extraCount} more</span>
              )}
            </p>
          )}

          {/* Date + total */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-dark-400">{formatDate(order.createdAt)}</span>
            <span className="text-sm font-black text-brand-800">
              {formatCurrency(order.total || order.totalAmount)}
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="text-dark-300 flex-shrink-0" />
      </div>
    </Link>
  );
}

export default OrderCard;
