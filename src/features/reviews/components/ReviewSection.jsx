import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Play } from 'lucide-react';
import { getProductReviews } from '../services/review.service';
import { imageUrl } from '../../../shared/utils/format';

export function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  const interactive = Boolean(onChange);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={size}
            className={star <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-dark-200'}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ productId }) {
  const { data } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getProductReviews(productId),
    staleTime: 60_000,
  });

  const reviews = data?.data?.reviews ?? [];
  const avg = data?.data?.avg ?? 0;
  const count = data?.data?.count ?? 0;

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-dark-900">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating value={Math.round(avg)} size={14} />
            <span className="text-sm text-dark-500">{avg.toFixed(1)} ({count})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-dark-400 py-4">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const media = (() => { try { return JSON.parse(r.media || '[]'); } catch { return []; } })();
            return (
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
                {media.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {media.map((url, i) => {
                      const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
                      return (
                        <a key={i} href={imageUrl(url)} target="_blank" rel="noopener noreferrer"
                          className="relative w-20 h-20 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0 block hover:opacity-90 transition-opacity"
                        >
                          {isVideo ? (
                            <>
                              <video src={imageUrl(url)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play size={16} className="text-white fill-white" />
                              </div>
                            </>
                          ) : (
                            <img src={imageUrl(url)} alt="" className="w-full h-full object-cover" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
