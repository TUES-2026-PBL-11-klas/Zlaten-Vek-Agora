import { Toaster as SonnerToaster } from "sonner";

const baseToast = [
  "group relative flex w-full items-start gap-3 overflow-hidden",
  "rounded-2xl border border-hair bg-surface text-ink-primary",
  "px-5 py-4",
  "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-transparent",
].join(" ");

const baseTitle = "font-serif text-[15px] leading-[22px] tracking-tight text-ink-primary";
const baseDescription = "font-sans text-[13px] leading-[20px] text-ink-muted";
const baseAction =
  "rounded-full bg-ink-button px-3 py-1.5 text-[12px] font-medium text-cream hover:bg-ink-primary";
const baseCancel =
  "rounded-full bg-surface-mut px-3 py-1.5 text-[12px] font-medium text-ink-primary hover:bg-surface-2";
const baseClose = "text-ink-label hover:text-ink-primary transition-colors absolute right-3 top-3";

export function AppToaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={5000}
      gap={12}
      offset={24}
      visibleToasts={4}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: baseToast,
          title: baseTitle,
          description: baseDescription,
          actionButton: baseAction,
          cancelButton: baseCancel,
          closeButton: baseClose,
          success: "before:bg-persona-sage",
          error: "before:bg-persona-terracotta",
          warning: "before:bg-persona-mustard",
          info: "before:bg-persona-aubergine",
          default: "before:bg-ink-label",
        },
      }}
    />
  );
}
