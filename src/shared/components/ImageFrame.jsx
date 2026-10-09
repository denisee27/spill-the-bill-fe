export function ImageFrame({ src, alt, className = '', aspectRatio = '1/1' }) {
  return (
    <div
      className={`relative bg-white overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <div className="absolute inset-2 border border-dark-100 rounded-lg pointer-events-none z-10" />
      <img
        src={src}
        alt={alt || ''}
        className="w-full h-full object-contain p-3"
        loading="lazy"
      />
    </div>
  );
}

export default ImageFrame;
