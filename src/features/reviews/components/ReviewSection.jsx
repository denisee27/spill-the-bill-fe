import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Image, Play } from 'lucide-react';
import { getProductReviews } from '../services/review.service';
import { imageUrl } from '../../../shared/utils/format';
import { ImageLightbox } from '../../../shared/components/ImageLightbox';

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

function UserAvatar({ name }) {
  const initials = (name || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const palettes = [
    'bg-brand-100 text-brand-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
  ];
  const palette = palettes[(name || '').charCodeAt(0) % palettes.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${palette}`}>
      {initials}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function ReviewSection({ productId }) {
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const { data } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getProductReviews(productId),
    staleTime: 60_000,
  });

  const reviews = data?.data?.reviews ?? [];
  const avg = data?.data?.avg ?? 0;
  const count = data?.data?.count ?? 0;

  const starCounts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { c[r.rating] = (c[r.rating] || 0) + 1; });
    return c;
  }, [reviews]);

  const withComment = reviews.filter((r) => r.comment?.trim()).length;
  const withMedia = reviews.filter((r) => {
    try { return JSON.parse(r.media || '[]').length > 0; } catch { return false; }
  }).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews;
    if (filter === 'comment') return reviews.filter((r) => r.comment?.trim());
    if (filter === 'media') return reviews.filter((r) => {
      try { return JSON.parse(r.media || '[]').length > 0; } catch { return false; }
    });
    const star = parseInt(filter);
    if (!isNaN(star)) return reviews.filter((r) => r.rating === star);
    return reviews;
  }, [reviews, filter]);

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-dark-900 mb-4">Penilaian Produk</h2>

      {count === 0 ? (
        <div className="bg-white border border-dark-100 rounded-2xl p-10 text-center">
          <Star size={36} className="text-dark-200 mx-auto mb-2" />
          <p className="text-sm text-dark-400">Belum ada penilaian untuk produk ini.</p>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="bg-white border border-dark-100 rounded-2xl p-5 mb-4">
            <div className="flex gap-6">
              <div className="flex flex-col items-center justify-center min-w-[88px]">
                <span className="text-5xl font-extrabold text-brand-700 leading-none">{avg.toFixed(1)}</span>
                <span className="text-xs text-dark-400 mt-1">dari 5</span>
                <div className="mt-2">
                  <StarRating value={Math.round(avg)} size={14} />
                </div>
                <span className="text-xs text-dark-400 mt-1.5">{count} penilaian</span>
              </div>

              <div className="w-px bg-dark-100 self-stretch" />

              <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = count > 0 ? (starCounts[star] / count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-dark-500 w-3 text-right shrink-0">{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-dark-400 w-4 text-right shrink-0">{starCounts[star]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { key: 'all', label: 'Semua', count },
              { key: '5', label: '5 Bintang', count: starCounts[5] },
              { key: '4', label: '4 Bintang', count: starCounts[4] },
              { key: '3', label: '3 Bintang', count: starCounts[3] },
              { key: '2', label: '2 Bintang', count: starCounts[2] },
              { key: '1', label: '1 Bintang', count: starCounts[1] },
              { key: 'comment', label: 'Dengan Komentar', count: withComment, icon: <MessageSquare size={12} /> },
              { key: 'media', label: 'Dengan Media', count: withMedia, icon: <Image size={12} /> },
            ].map(({ key, label, count: c, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filter === key
                    ? 'border-brand-700 text-brand-700 bg-brand-50 font-semibold'
                    : 'border-dark-200 text-dark-600 hover:border-dark-400 bg-white'
                }`}
              >
                {icon}
                {label} ({c})
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {filtered.length === 0 ? (
            <p className="text-sm text-dark-400 py-6 text-center">Tidak ada ulasan untuk filter ini.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const media = (() => { try { return JSON.parse(r.media || '[]'); } catch { return []; } })();
                return (
                  <div key={r.id} className="bg-white border border-dark-100 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar name={r.user?.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-dark-900">{r.user?.name || 'Anonim'}</p>
                          <span className="text-xs text-dark-400 shrink-0">{formatDate(r.createdAt)}</span>
                        </div>
                        <div className="mt-0.5">
                          <StarRating value={r.rating} size={13} />
                        </div>
                        {r.comment && (
                          <p className="text-sm text-dark-700 mt-2 leading-relaxed">{r.comment}</p>
                        )}
                        {media.length > 0 && (() => {
                          const imageUrls = media
                            .filter((u) => !/\.(mp4|mov|webm|avi)$/i.test(u))
                            .map((u) => imageUrl(u));
                          return (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {media.map((url, i) => {
                                const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
                                const imgIndex = imageUrls.indexOf(imageUrl(url));
                                return isVideo ? (
                                  <a
                                    key={i}
                                    href={imageUrl(url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0 block hover:opacity-90 transition-opacity"
                                  >
                                    <video src={imageUrl(url)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <Play size={16} className="text-white fill-white" />
                                    </div>
                                  </a>
                                ) : (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setLightbox({ images: imageUrls, index: imgIndex })}
                                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0 block hover:opacity-90 transition-opacity"
                                  >
                                    <img src={imageUrl(url)} alt="" className="w-full h-full object-cover" />
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default ReviewSection;
