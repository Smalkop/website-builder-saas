export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastMessage) => void;
let listeners: Listener[] = [];
let idCounter = 0;

export function showToast(message: string, type: ToastType = 'info') {
  const toast: ToastMessage = { message, type, id: ++idCounter };
  listeners.forEach(fn => fn(toast));
}

export function onToast(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}
