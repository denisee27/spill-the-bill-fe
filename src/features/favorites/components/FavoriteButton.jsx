import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { toggleFavorite, getFavoriteStatus } from '../services/favorite.service';
import { useAuth } from '../../auth/hooks/useAuth';

export function FavoriteButton({ productId, onRequireAuth, size = 'md' }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['favorite-status', productId],
    queryFn: () => getFavoriteStatus(productId),
    enabled: !!isAuthenticated,
    staleTime: 60_000,
  });

  const favorited = data?.data?.favorited ?? false;

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleFavorite(productId),
    onSuccess: (res) => {
      queryClient.setQueryData(['favorite-status', productId], {
        data: { favorited: res.data.favorited },
      });
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
    },
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { onRequireAuth?.(); return; }
    mutate();
  };

  const iconSize = size === 'sm' ? 15 : 18;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={clsx(
        'rounded-full transition-all disabled:opacity-50 shadow-sm',
        size === 'sm' ? 'p-1.5' : 'p-2',
        favorited
          ? 'text-red-500 bg-white hover:bg-red-50'
          : 'text-dark-400 bg-white/90 hover:text-red-400 hover:bg-white',
      )}
    >
      <Heart
        size={iconSize}
        className={clsx('transition-all', favorited && 'fill-current')}
      />
    </button>
  );
}

export default FavoriteButton;
