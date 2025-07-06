import type React from "react";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // アニメーションのために少し遅延させてから完全に削除
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const toastClasses = `
    fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white transition-all duration-300 ease-out
    ${type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"}
    ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
  `;

  return ReactDOM.createPortal(
    <div className={toastClasses}>{message}</div>,
    document.body,
  );
};

export default Toast;
