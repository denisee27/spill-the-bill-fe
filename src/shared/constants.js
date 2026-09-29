/**
 * Application-wide constants for Spill the Bill
 */

export const PRODUCT_TYPE = Object.freeze({
  JASTIP: 'JASTIP',
  PRELOVED: 'PRELOVED',
});

export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CHECKING_PAYMENT: 'CHECKING_PAYMENT',
  PAYMENT_APPROVED: 'PAYMENT_APPROVED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUNDED: 'REFUNDED',
});

export const ORDER_STATUS_LABEL = Object.freeze({
  PENDING_PAYMENT: 'Pending Payment',
  CHECKING_PAYMENT: 'Checking Payment',
  PAYMENT_APPROVED: 'Payment Approved',
  PAYMENT_REJECTED: 'Payment Rejected',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUND_REQUESTED: 'Refund Requested',
  REFUNDED: 'Refunded',
});

export const ORDER_STATUS_COLOR = Object.freeze({
  PENDING_PAYMENT: 'yellow',
  CHECKING_PAYMENT: 'blue',
  PAYMENT_APPROVED: 'green',
  PAYMENT_REJECTED: 'red',
  PROCESSING: 'indigo',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'gray',
  REFUND_REQUESTED: 'orange',
  REFUNDED: 'teal',
});

export const TAB_VALUES = Object.freeze({
  ALL: 'all',
  JASTIP: 'jastip',
  PRELOVED: 'preloved',
});

export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

export const VOUCHER_TYPE = Object.freeze({
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
});

export const CHECKOUT_STEPS = Object.freeze({
  ADDRESS: 1,
  PAYMENT: 2,
  UPLOAD_PROOF: 3,
});

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const WHATSAPP_DEFAULT_NUMBER = '6281234567890';

export const ORDER_STATUS_BAR_COLOR = Object.freeze({
  PENDING_PAYMENT:  'bg-yellow-400',
  CHECKING_PAYMENT: 'bg-blue-400',
  PAYMENT_APPROVED: 'bg-green-400',
  PAYMENT_REJECTED: 'bg-red-400',
  PROCESSING:       'bg-indigo-400',
  SHIPPED:          'bg-purple-400',
  DELIVERED:        'bg-green-500',
  CANCELLED:        'bg-dark-300',
  REFUND_REQUESTED: 'bg-orange-400',
  REFUNDED:         'bg-teal-400',
});
