import Badge from '../../../shared/components/Badge';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '../../../shared/constants';

/**
 * Colored badge for order status.
 */
export function OrderStatusBadge({ status }) {
  const color = ORDER_STATUS_COLOR[status] || 'gray';
  const label = ORDER_STATUS_LABEL[status] || status;

  return <Badge color={color}>{label}</Badge>;
}

export default OrderStatusBadge;
