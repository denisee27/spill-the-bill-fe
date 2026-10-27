import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Plus, Camera, Image, Wand2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { removeBackground } from '@imgly/background-removal';
import { imageUrl } from '../utils/format';
import { ImageLightbox } from './ImageLightbox';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function addCanvasWatermark(ctx, W, H) {
  const fontSize = Math.max(14, Math.round(W * 0.04));
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(180, 180, 180, 0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@spillthebill', 0, 0);
  ctx.restore();
}

async function removeBackgroundToWhite(productFile) {
  const bgRemovedBlob = await removeBackground(productFile, {
    output: { format: 'image/png', type: 'foreground', quality: 0.9 },
    model: 'small',
  });

  const product = await loadImage(URL.createObjectURL(bgRemovedBlob));
  const W = product.naturalWidth;
  const H = product.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(product, 0, 0, W, H);
  addCanvasWatermark(ctx, W, H);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], `bg-removed-${productFile.name.replace(/\.[^.]+$/, '')}.jpeg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.93
    );
  });
}

export function MediaUpload({ files = [], onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [processing, setProcessing] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const pickerRef = useRef(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const isVideo = (file) => {
    if (file instanceof File) return file.type.startsWith('video/');
    if (typeof file === 'string') return /\.(mp4|mov|webm|avi)$/i.test(file);
    return false;
  };

  const getPreviewUrl = (file) => {
    if (file instanceof File) return URL.createObjectURL(file);
    return imageUrl(file);
  };

  const addFiles = useCallback((incoming) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/avi'];
    const valid = Array.from(incoming).filter((f) => allowed.includes(f.type));
    if (valid.length) onChange([...files, ...valid]);
  }, [files, onChange]);

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
    setPickerOpen(false);
  };

  const handleRemove = (i) => onChange(files.filter((_, idx) => idx !== i));

  // Drag and drop handlers
  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => {
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemoveBackground = async (i) => {
    const file = files[i];
    if (!(file instanceof File) || file.type.startsWith('video/')) {
      toast.error('Only works on uploaded image files.');
      return;
    }
    setProcessing((p) => ({ ...p, [i]: true }));
    const toastId = toast.loading('Removing background…');
    try {
      const result = await removeBackgroundToWhite(file);
      const next = [...files];
      next[i] = result;
      onChange(next);
      toast.success('Background removed!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to process image.', { id: toastId });
    } finally {
      setProcessing((p) => ({ ...p, [i]: false }));
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl transition-colors ${isDragging ? 'bg-brand-50 ring-2 ring-brand-400 ring-dashed p-3' : 'p-0'}`}
    >
      {isDragging && (
        <div className="flex flex-col items-center justify-center py-8 text-brand-700 pointer-events-none">
          <Image size={32} className="mb-2 opacity-60" />
          <p className="text-sm font-semibold">Drop images here</p>
        </div>
      )}

      {!isDragging && (
        <>
          <div className="flex flex-wrap gap-3 mb-3">
            {(() => {
              const imageUrls = files
                .filter((f) => !isVideo(f))
                .map((f) => getPreviewUrl(f));
              return files.map((file, i) => {
                const imgIndexInGallery = isVideo(file) ? -1 : imageUrls.indexOf(getPreviewUrl(file));
                return (
                  <div
                    key={i}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-dark-200 bg-dark-50 flex-shrink-0 group"
                  >
                    {isVideo(file) ? (
                      <>
                        <video
                          src={getPreviewUrl(file)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <Play size={18} className="text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(imgIndexInGallery)}
                        className="w-full h-full cursor-zoom-in relative"
                      >
                        <img src={getPreviewUrl(file)} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-150" />
                      </button>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors z-10"
                    >
                      <X size={11} />
                    </button>

                    {/* Remove background button — only for image Files */}
                    {file instanceof File && !isVideo(file) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveBackground(i); }}
                        disabled={processing[i]}
                        title="Remove background"
                        className="absolute bottom-1 left-1 w-6 h-6 bg-brand-800 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors z-10 disabled:opacity-60"
                      >
                        {processing[i]
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Wand2 size={11} />
                        }
                      </button>
                    )}

                    {/* Processing overlay */}
                    {processing[i] && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <Loader2 size={20} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* Add button */}
            <div className="relative flex-shrink-0" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="w-24 h-24 border-2 border-dashed border-dark-300 rounded-xl flex flex-col items-center justify-center gap-1 text-dark-400 hover:border-brand-600 hover:text-brand-700 transition-colors"
              >
                <Plus size={20} />
                <span className="text-xs font-medium">Add</span>
              </button>

              {pickerOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-dark-200 overflow-hidden z-30 w-44">
                  <button
                    type="button"
                    onClick={() => { setPickerOpen(false); setTimeout(() => cameraRef.current?.click(), 50); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-dark-700 hover:bg-dark-50 transition-colors"
                  >
                    <Camera size={16} className="text-brand-700 flex-shrink-0" />
                    Take Photo
                  </button>
                  <div className="border-t border-dark-100" />
                  <button
                    type="button"
                    onClick={() => { setPickerOpen(false); setTimeout(() => galleryRef.current?.click(), 50); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-dark-700 hover:bg-dark-50 transition-colors"
                  >
                    <Image size={16} className="text-brand-700 flex-shrink-0" />
                    Choose Gallery
                  </button>
                </div>
              )}
            </div>
          </div>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={handleInputChange} />

          <div className="space-y-1">
            <p className="text-xs text-dark-400">
              Images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) · Max 100 MB per file · Drag & drop supported
            </p>
            <p className="text-xs text-dark-400 flex items-center gap-1">
              <Wand2 size={11} className="text-brand-700 flex-shrink-0" />
              Click the wand on any uploaded image to remove background (white bg + watermark)
            </p>
          </div>
        </>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={files.filter((f) => !isVideo(f)).map((f) => getPreviewUrl(f))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

export default MediaUpload;
