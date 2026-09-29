import { useState, useRef, useCallback } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

export function useConfirm() {
  const [state, setState] = useState({ open: false, opts: {} });
  const resolveRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((res) => {
      resolveRef.current = res;
      setState({ open: true, opts });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  }, []);

  const Dialog = () => (
    <ConfirmModal
      isOpen={state.open}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...state.opts}
    />
  );

  return { confirm, Dialog };
}
