import { MapPin, Calendar, Package } from 'lucide-react';
import { imageUrl, formatDate } from '../../../shared/utils/format';

function isLiveNow(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const now = Date.now();
  return now >= new Date(startDate).getTime() && now <= new Date(endDate).getTime();
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }
  return null;
}

const STATUS_CONFIG = {
  ACTIVE: { style: 'bg-green-100 text-green-700', label: 'Active' },
  CLOSED: { style: 'bg-gray-100 text-gray-600', label: 'Closed' },
  DRAFT:  { style: 'bg-yellow-100 text-yellow-700', label: 'Draft' },
};

export function EventCard({ event, onClick }) {
  const live = isLiveNow(event.startDate, event.endDate);
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const productCount =
    event._count?.products ?? event.products?.length ?? 0;
  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;

  const daysLeft = event.endDate
    ? Math.ceil((new Date(event.endDate) - Date.now()) / 86400000)
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl shadow-sm border border-dark-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-700"
    >
      {/* Banner */}
      <div className="relative h-40 overflow-hidden">
        {event.bannerImage ? (
          <img
            src={imageUrl(event.bannerImage)}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-800 to-brand-950" />
        )}

        {/* Live badge */}
        {live && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-brand-800 text-white text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE NOW
          </div>
        )}

        {/* Ends soon badge */}
        {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
            Ends in {daysLeft}d
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Name */}
        <h3 className="text-sm font-bold text-dark-900 leading-snug line-clamp-2">
          {event.name}
        </h3>

        {/* Destination */}
        {event.destination && (
          <div className="flex items-center gap-1.5 text-dark-500 text-xs">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{event.destination}</span>
          </div>
        )}

        {/* Date range */}
        {dateRange && (
          <div className="flex items-center gap-1.5 text-dark-500 text-xs">
            <Calendar size={12} className="flex-shrink-0" />
            <span>{dateRange}</span>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          {/* Product count */}
          <div className="flex items-center gap-1 text-dark-500 text-xs">
            <Package size={12} />
            <span>{productCount} product{productCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Status badge */}
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusCfg.style}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>
    </button>
  );
}

export default EventCard;
