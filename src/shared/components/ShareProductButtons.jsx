import toast from 'react-hot-toast';
import { Link2 } from 'lucide-react';
import { formatCurrency, imageUrl } from '../utils/format';

const btnClass =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dark-200 rounded-lg text-xs text-dark-600 hover:bg-dark-50 transition-colors';

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.74-.435-.486-1.05-.733-1.83-.733l-.027.001c-.9.007-1.586.31-2.042.902-.34.44-.553.993-.636 1.647l-2.04-.288c.124-.963.455-1.82.985-2.546C11.475 5.39 12.791 4.74 14.484 4.726h.052c1.16 0 2.145.292 2.929.868.947.695 1.545 1.754 1.78 3.147.05.005.1.01.148.017 1.17.158 2.207.657 2.988 1.45 1.088 1.1 1.636 2.69 1.24 4.762-.453 2.375-1.739 4.22-3.679 5.35C18.219 21.3 16.448 22.5 12.186 24zm.024-8.23c-.867 0-1.558-.241-2.054-.716-.45-.43-.675-.998-.637-1.596.046-.754.404-1.288.943-1.548.487-.233 1.047-.294 1.666-.179 1.02.186 1.798.75 2.166 1.576.114.257.198.538.249.839a5.27 5.27 0 0 0-2.333 1.624z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

function buildProductUrl(product) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/products/${product.id}`;
}

function getFirstImageSrc(product) {
  const imgs = product?.images || [];
  const raw = imgs[0]?.url || imgs[0] || null;
  return raw ? imageUrl(raw) : null;
}

function buildXText(product, price) {
  const lines = [
    `✨ ${product.name}`,
    '',
    `💰 ${formatCurrency(price)}`,
    `🛍️ Tersedia di Spill the Bill!`,
    '',
    '#SpillTheBill #Preloved #Jastip #Jakarta',
  ];
  return lines.join('\n');
}

function buildThreadsText(product, price, url) {
  const lines = [
    `Lagi nemu barang bagus nih! ✨`,
    '',
    `🛍️ ${product.name}`,
    `💰 ${formatCurrency(price)}`,
    '',
    `Kondisi: ${product.condition || 'New'} · Stok terbatas!`,
    '',
    `Langsung cek di sini 👇`,
    url,
    '',
    '#SpillTheBill #Preloved #Jastip #SeconHand #Jakarta',
  ];
  return lines.join('\n');
}

function buildNativeText(product, price) {
  const lines = [
    `✨ ${product.name}`,
    `💰 ${formatCurrency(price)}`,
    ``,
    `Kondisi: ${product.condition || 'New'}`,
    `Stok terbatas — yuk buruan sebelum kehabisan! 🔥`,
    ``,
    `#SpillTheBill #Preloved #Jastip`,
  ];
  return lines.join('\n');
}

async function fetchImageFile(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    return new File([blob], `product.${ext}`, { type: blob.type });
  } catch {
    return null;
  }
}

export function ShareProductButtons({ product }) {
  if (!product) return null;

  const price = product.displayPrice ?? product.price ?? 0;
  const url = buildProductUrl(product);
  const imgSrc = getFirstImageSrc(product);

  const shareX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(buildXText(product, price))}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareThreads = () => {
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(buildThreadsText(product, price, url))}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareInstagram = async () => {
    if (typeof navigator === 'undefined') return;

    // Try native share with image file (works on mobile)
    if (navigator.share) {
      let shared = false;

      if (imgSrc && navigator.canShare) {
        const file = await fetchImageFile(imgSrc);
        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: product.name,
              text: buildNativeText(product, price),
            });
            shared = true;
          } catch (err) {
            if (err?.name !== 'AbortError') {
              // image share failed, fall through to URL share
            } else {
              return; // user cancelled
            }
          }
        }
      }

      if (!shared) {
        try {
          await navigator.share({
            title: product.name,
            text: buildNativeText(product, price),
            url,
          });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
        }
      } else {
        return;
      }
    }

    // Desktop fallback: copy link + instructions
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
    toast.success(
      'Link disalin! Buka Instagram → buat postingan/story → tempel link di caption.',
      { duration: 5000 }
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link disalin!');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-dark-400 font-medium">Share:</span>

      <button onClick={shareX} className={btnClass} aria-label="Share to X">
        <XIcon /> X
      </button>

      <button onClick={shareThreads} className={btnClass} aria-label="Share to Threads">
        <ThreadsIcon /> Threads
      </button>

      <button onClick={shareInstagram} className={btnClass} aria-label="Share to Instagram">
        <InstagramIcon /> Instagram
      </button>

      <button onClick={copyLink} className={btnClass} aria-label="Copy link">
        <Link2 size={13} /> Salin Link
      </button>
    </div>
  );
}

export default ShareProductButtons;
