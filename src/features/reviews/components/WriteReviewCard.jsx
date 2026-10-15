import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, Play } from 'lucide-react';
import { getMyReviewForProduct, submitReview } from '../services/review.service';
import { StarRating } from './ReviewSection';
import Button from '../../../shared/components/Button';
import MediaUpload from '../../../shared/components/MediaUpload';
import { imageUrl } from '../../../shared/utils/format';

function ReviewMediaGrid({ media }) {
  if (!media?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {media.map((url, i) => {
        const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
        return (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
            {isVideo ? (
              <>
                <video src={imageUrl(url)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play size={14} className="text-white fill-white" />
                </div>
              </>
            ) : (
              <img src={imageUrl(url)} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WriteReviewCard({ productId, productName, productImage }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['my-review', productId],
    queryFn: () => getMyReviewForProduct(productId),
    staleTime: 60_000,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => submitReview(productId, { rating, comment, mediaFiles }),
    onSuccess: () => {
      toast.success('Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['my-review', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to submit review'),
  });

  if (isLoading) return null;

  const existingMedia = (() => {
    try { return JSON.parse(existing?.media || '[]'); } catch { return []; }
  })();

  return (
    <div className="flex gap-3">
      {productImage && (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
          <img
            src={imageUrl(productImage)}
            alt={productName}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark-900 mb-2 truncate">{productName}</p>

        {existing ? (
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-xl p-3">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Review submitted</p>
              <StarRating value={existing.rating} size={13} />
              {existing.comment && (
                <p className="text-dark-600 mt-1 text-xs leading-relaxed">{existing.comment}</p>
              )}
              <ReviewMediaGrid media={existingMedia} />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <StarRating value={rating} onChange={setRating} size={22} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
            />
            <MediaUpload files={mediaFiles} onChange={setMediaFiles} />
            <Button
              variant="primary"
              size="sm"
              disabled={rating === 0 || isPending}
              onClick={() => mutate()}
            >
              {isPending ? 'Uploading...' : 'Submit Review'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WriteReviewCard;
