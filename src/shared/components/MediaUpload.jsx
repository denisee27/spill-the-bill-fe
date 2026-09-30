import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Film, Plus, Camera, Image, Wand2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { removeBackground } from '@imgly/background-removal';
import { imageUrl } from '../utils/format';

const TEMPLATE_SRC = '/template.jpeg';

// Product sits ON the podium. Podium top ≈ 63% from image top, centered horizontally.
const PLACEMENT = {
  maxWidthRatio: 0.48,   // product max width = 48% of template width
  maxHeightRatio: 0.42,  // product max height = 42% of template height
  bottomRatio: 0.655,    // product bottom edge lands at 65.5% from top (podium surface)
  centerXRatio: 0.50,    // centered horizontally
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compositeOnTemplate(productFile) {
  const [template, bgRemovedBlob] = await Promise.all([
    loadImage(TEMPLATE_SRC),
    removeBackground(productFile, { output: { format: 'image/png' } }),
  ]);

  const product = await loadImage(URL.createObjectURL(bgRemovedBlob));

  const W = template.naturalWidth;
  const H = template.naturalHeight;

  const maxPW = W * PLACEMENT.maxWidthRatio;
  const maxPH = H * PLACEMENT.maxHeightRatio;
  const scale = Math.min(maxPW / product.naturalWidth, maxPH / product.naturalHeight);

  const pw = product.naturalWidth * scale;
  const ph = product.naturalHeight * scale;
  const px = W * PLACEMENT.centerXRatio - pw / 2;
  const py = H * PLACEMENT.bottomRatio - ph;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0, W, H);
  ctx.drawImage(product, px, py, pw, ph);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], `templated-${productFile.name.replace(/\.[^.]+$/, '')}.jpeg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.93
    );
  });
}

export function MediaUpload({ files = [], onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [processing, setProcessing] = useState({});
  const [isDragging, setIsDragging] = useState(false);
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

  const handleApplyTemplate = async (i) => {
    const file = files[i];
    if (!(file instanceof File) || file.type.startsWith('video/')) {
      toast.error('Template can only be applied to image files you just uploaded.');
      return;
    }
    setProcessing((p) => ({ ...p, [i]: true }));
    const toastId = toast.loading('Removing background & applying template…');
    try {
      const result = await compositeOnTemplate(file);
      const next = [...files];
      next[i] = result;
      onChange(next);
      toast.success('Template applied!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to process image. Try again.', { id: toastId });
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
            {files.map((file, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-dark-200 bg-dark-50 flex-shrink-0 group"
              >
                {isVideo(file) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-dark-400">
                    <Film size={24} />
                    <span className="text-xs px-1 truncate w-full text-center">
                      {file instanceof File ? file.name.slice(0, 10) : 'Video'}
                    </span>
                  </div>
                ) : (
                  <img src={getPreviewUrl(file)} className="w-full h-full object-cover" alt="" />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors z-10"
                >
                  <X size={11} />
                </button>

                {/* Apply template button — only for image Files */}
                {file instanceof File && !isVideo(file) && (
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(i)}
                    disabled={processing[i]}
                    title="Remove background & apply template"
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
              </div>
            ))}

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
              Click the red wand on any uploaded image to remove background & apply brand template
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default MediaUpload;
