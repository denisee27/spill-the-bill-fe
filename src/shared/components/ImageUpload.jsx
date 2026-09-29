import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';

export function ImageUpload({ files = [], onChange, multiple = true, className = '' }) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((file) =>
      file instanceof File ? URL.createObjectURL(file) : file
    );
    setPreviews(urls);
    return () => {
      urls.forEach((url) => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
    };
  }, [files]);

  const onDrop = (accepted) => {
    onChange(multiple ? [...files, ...accepted] : accepted);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple,
  });

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={clsx('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-600 bg-brand-50'
            : 'border-dark-300 bg-dark-50 hover:border-brand-500 hover:bg-brand-50'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud size={36} className="text-dark-400 mb-3" />
        {isDragActive ? (
          <p className="text-brand-700 font-medium text-sm">Drop images here...</p>
        ) : (
          <>
            <p className="text-dark-600 font-medium text-sm">Drag & drop images here</p>
            <p className="text-dark-400 text-xs mt-1">or click to select files</p>
          </>
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((src, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-dark-200 bg-dark-50">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
