const CONDITION_COLORS = {
  New: 'bg-green-100 text-green-700',
  Good: 'bg-blue-100 text-blue-700',
  'Well Used': 'bg-amber-100 text-amber-700',
};

export function ConditionBadge({ condition }) {
  if (!condition) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${CONDITION_COLORS[condition] || 'bg-dark-100 text-dark-600'}`}>
      {condition}
    </span>
  );
}

export default ConditionBadge;
