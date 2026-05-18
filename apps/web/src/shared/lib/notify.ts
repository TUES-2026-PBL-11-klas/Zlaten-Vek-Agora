import { toast } from "sonner";

interface NotifyOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick(): void };
}

export const notify = {
  success(title: string, options?: NotifyOptions) {
    return toast.success(title, options);
  },
  error(title: string, options?: NotifyOptions) {
    return toast.error(title, options);
  },
  info(title: string, options?: NotifyOptions) {
    return toast.info(title, options);
  },
  message(title: string, options?: NotifyOptions) {
    return toast(title, options);
  },
  dismiss(id?: string | number) {
    return toast.dismiss(id);
  },
};
