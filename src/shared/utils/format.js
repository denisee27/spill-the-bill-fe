import { format, parseISO } from 'date-fns';
import { ORDER_STATUS_LABEL } from '../constants';

/**
 * Format a number as Indonesian Rupiah currency
 * @param {number} amount
 * @returns {string} e.g. "Rp 150.000"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('IDR', 'Rp')
    .trim();
}

/**
 * Format a date string
 * @param {string|Date} date
 * @param {string} [fmt='dd MMM yyyy']
 * @returns {string}
 */
export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return format(parsed, fmt);
  } catch {
    return '-';
  }
}

/**
 * Format a date+time string
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

/**
 * Get the human-readable label for an order status
 * @param {string} status
 * @returns {string}
 */
export function formatOrderStatus(status) {
  return ORDER_STATUS_LABEL[status] || status || '-';
}

/**
 * Build full image URL from a relative backend path
 * @param {string} path
 * @returns {string}
 */
export function imageUrl(path) {
  if (!path || typeof path !== 'string') return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `/uploads/${path.replace(/^\/uploads\//, '')}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
