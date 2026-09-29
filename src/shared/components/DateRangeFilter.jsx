import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, X } from 'lucide-react';

const toDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toStr = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function DateRangeFilter({ value, onChange, className = '' }) {
  const { startDate = '', endDate = '' } = value || {};
  const start = toDate(startDate);
  const end = toDate(endDate);

  const handleChange = ([s, e]) => {
    onChange({ startDate: toStr(s), endDate: toStr(e) });
  };

  const handleClear = (ev) => {
    ev.stopPropagation();
    onChange({ startDate: '', endDate: '' });
  };

  const label = start
    ? end
      ? `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
      : start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select date range';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <DatePicker
        selectsRange
        startDate={start}
        endDate={end}
        onChange={handleChange}
        maxDate={new Date()}
        dateFormat="dd MMM yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperPlacement="bottom-end"
        customInput={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dark-200 rounded-lg text-dark-700 hover:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white transition-colors"
          >
            <CalendarDays size={14} className="text-dark-400 flex-shrink-0" />
            <span className={start ? 'text-dark-800' : 'text-dark-400'}>{label}</span>
            {(start || end) && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
                className="ml-1 text-dark-300 hover:text-dark-700"
              >
                <X size={12} />
              </span>
            )}
          </button>
        }
      />
    </div>
  );
}

export default DateRangeFilter;
