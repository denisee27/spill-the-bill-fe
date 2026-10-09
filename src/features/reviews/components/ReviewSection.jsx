import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductReviews, submitReview, deleteReview } from '../services/review.service';
import Button from '../../../shared/components/Button';

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-dark-200'
            }
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, existingReview, onDone }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const { mutate, isPending } = useMutation({
    mutationFn: () => submitReview(productId, { rating, comment }),
    onSuccess: () => {
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      onDone?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to submit review'),
  });

  return (
    <div className="bg-dark-50 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-dark-800">
        {existingReview ? 'Edit your review' : 'Write a review'}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts (optional)"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
      />
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={rating === 0 || isPending}
          onClick={() => mutate()}
        >
          {isPending ? 'Saving...' : 'Submit'}
        </Button>
        {onDone && (
          <Button variant="outline" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function ReviewSection({ productId, isAuthenticated, onRequireAuth }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getProductReviews(productId),
    staleTime: 60_000,
  });

  const reviews = data?.data?.reviews ?? [];
  const avg = data?.data?.avg ?? 0;
  const count = data?.data?.count ?? 0;

  const { mutate: doDelete } = useMutation({
    mutationFn: () => deleteReview(productId),
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-dark-900">Reviews</h2>
          {count > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={Math.round(avg)} size={14} />
              <span className="text-sm text-dark-500">{avg.toFixed(1)} ({count})</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!isAuthenticated) { onRequireAuth?.(); return; }
            setShowForm((v) => !v);
          }}
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </Button>
      </div>

      {showForm && isAuthenticated && (
        <div className="mb-5">
          <ReviewForm productId={productId} onDone={() => setShowForm(false)} />
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-dark-400 py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-dark-100 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-900">{r.user?.name || 'Anonymous'}</p>
                  <StarRating value={r.rating} size={13} />
                </div>
                <span className="text-xs text-dark-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-dark-700 mt-2 leading-relaxed">{r.comment}</p>
              )}
              {isAuthenticated && r.userId === undefined && (
                <button
                  onClick={() => doDelete()}
                  className="text-xs text-red-500 hover:underline mt-2"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
