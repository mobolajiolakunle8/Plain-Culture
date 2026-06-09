import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-[#E8FF6B]" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "info":
        return <Info className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getBg = () => {
    return "bg-black/95 text-white border border-zinc-800/80 shadow-2xl backdrop-blur-md";
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg transition-all duration-300 transform translate-x-0 animate-slide-in ${getBg()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium leading-tight">{toast.text}</div>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-white transition-colors p-0.5 hover:bg-zinc-800 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
