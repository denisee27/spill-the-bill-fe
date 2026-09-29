import { useState, useRef, useEffect } from 'react';
import { X, Film, Plus, Camera, Image } from 'lucide-react';
import { imageUrl } from '../utils/format';

export function MediaUpload({ files = [], onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
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

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length) onChange([...files, ...newFiles]);
    e.target.value = '';
    setPickerOpen(false);
  };

  const handleRemove = (i) => {
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {files.map((file, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-dark-200 bg-dark-50 flex-shrink-0"
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
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Add button + picker */}
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

      {/* Camera: single image capture */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
      {/* Gallery: multiple images + video */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <p className="text-xs text-dark-400">
        Images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) · Max 100 MB per file
      </p>
    </div>
  );
}

export default MediaUpload;
