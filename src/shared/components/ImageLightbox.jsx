import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export function ImageLightbox({ src, images: imagesProp, initialIndex = 0, alt = '', onClose }) {
  // Normalise to an array
  const images = imagesProp?.length
    ? imagesProp.map((i) => (typeof i === 'string' ? i : i?.url || i?.src || i))
    : src
    ? [src]
    : [];

  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, images.length - 1)));
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const MIN = 0.5;
  const MAX = 5;
  const STEP = 0.4;

  const resetView = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);

  const zoom = useCallback((delta) => {
    setScale((s) => Math.min(MAX, Math.max(MIN, parseFloat((s + delta).toFixed(2)))));
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
    resetView();
  }, [images.length, resetView]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
    resetView();
  }, [images.length, resetView]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoom(STEP);
      if (e.key === '-') zoom(-STEP);
      if (e.key === '0') resetView();
      if (e.key === 'ArrowLeft' && images.length > 1) prev();
      if (e.key === 'ArrowRight' && images.length > 1) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom, resetView, prev, next, images.length, onClose]);

  const onWheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? STEP : -STEP);
  };

  const onMouseDown = (e) => {
    if (scale === 1) return;
    dragging.current = true;
    origin.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPos({
      x: startPos.current.x + (e.clientX - origin.current.x),
      y: startPos.current.y + (e.clientY - origin.current.y),
    });
  };

  const onMouseUp = () => { dragging.current = false; };

  if (!images.length) return null;
  const currentSrc = images[index];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92"
      onClick={onClose}
    >
      {/* Top controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => zoom(-STEP)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" title="Zoom out (−)">
          <ZoomOut size={16} />
        </button>
        <span className="text-white/70 text-xs min-w-[42px] text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => zoom(STEP)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" title="Zoom in (+)">
          <ZoomIn size={16} />
        </button>
        <button onClick={resetView} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" title="Reset (0)">
          <RotateCcw size={14} />
        </button>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors ml-1" title="Close (Esc)">
          <X size={16} />
        </button>
      </div>

      {/* Prev button */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          title="Previous (←)"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
          title="Next (→)"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative"
        style={{ cursor: scale > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'default' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt || `Image ${index + 1}`}
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: dragging.current ? 'none' : 'transform 0.15s ease',
            maxWidth: '88vw',
            maxHeight: '85vh',
            display: 'block',
            userSelect: 'none',
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Counter + dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        {images.length > 1 && (
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); resetView(); }}
                className={`rounded-full transition-all duration-200 pointer-events-auto ${i === index ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
        <p className="text-white/40 text-xs select-none">
          {images.length > 1 ? `${index + 1} / ${images.length} · ` : ''}
          Scroll to zoom · Drag to pan · Esc to close
          {images.length > 1 ? ' · ← → navigate' : ''}
        </p>
      </div>
    </div>,
    document.body
  );
}

export default ImageLightbox;
