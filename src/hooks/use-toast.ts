import { useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let listeners: Array<(t: ToastMessage) => void> = [];
let count = 0;

export function toast({
  title,
  description,
  variant = "default",
}: Omit<ToastMessage, "id">) {
  const id = String(count++);
  const message: ToastMessage = { id, title, description, variant };
  listeners.forEach((fn) => fn(message));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((t: ToastMessage) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 5000);
  }, []);

  const subscribe = useCallback(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, subscribe, dismiss };
}
