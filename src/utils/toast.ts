import { toast } from "sonner";

export const showSuccess = (message: string, options?: { duration?: number }) => {
  return toast.success(message, {
    duration: options?.duration || 4000, // 4 segundos sensato
  });
};

export const showError = (message: string, options?: { duration?: number }) => {
  return toast.error(message, {
    duration: options?.duration || 6000, // Errores duran más para lectura
  });
};

export const showWarning = (message: string) => {
  return toast.warning(message, {
    duration: 5000,
  });
};

export const showInfo = (message: string) => {
  return toast.info(message, {
    duration: 4000,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};

export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
};
