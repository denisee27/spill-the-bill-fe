import { Toaster } from 'react-hot-toast';

/**
 * Global toast notification container.
 * Place once at app root.
 */
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1f2937',
          color: '#f9fafb',
          fontSize: '14px',
          padding: '12px 16px',
        },
        success: {
          style: {
            background: '#065f46',
            color: '#ecfdf5',
          },
          iconTheme: {
            primary: '#34d399',
            secondary: '#065f46',
          },
        },
        error: {
          style: {
            background: '#7f1d1d',
            color: '#fef2f2',
          },
          iconTheme: {
            primary: '#fca5a5',
            secondary: '#7f1d1d',
          },
        },
      }}
    />
  );
}

export default ToastContainer;
