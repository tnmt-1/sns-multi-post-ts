import { useCallback, useState } from "react";
import Toast from "../Toast";

interface ToastOptions {
  type?: "success" | "error" | "info";
  duration?: number;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Date.now();
    setToasts((prevToasts) => [
      ...prevToasts,
      {
        id,
        message,
        type: options?.type || "info",
        duration: options?.duration,
      },
    ]);
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-0 right-0 p-4 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};
