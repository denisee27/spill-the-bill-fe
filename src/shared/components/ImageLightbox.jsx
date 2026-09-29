import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function ImageLightbox({ src, alt = '', onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const MIN = 0.5;
  const MAX = 5;
  const STEP = 0.4;

  const zoom = (delta) =>
    setScale((s) => Math.min(MAX, Math.max(MIN, parseFloat((s + delta).toFixed(2)))));

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoom(STEP);
      if (e.key === '-') zoom(-STEP);
      if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => zoom(-STEP)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title="Zoom out (−)"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-white/70 text-xs min-w-[42px] text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => zoom(STEP)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={reset}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title="Reset (0)"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors ml-1"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        style={{ cursor: scale > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'default' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: dragging.current ? 'none' : 'transform 0.15s ease',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'block',
            userSelect: 'none',
          }}
        />
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs select-none">
        Scroll to zoom · Drag to pan · Esc to close
      </p>
    </div>,
    document.body
  );
}

export default ImageLightbox;
