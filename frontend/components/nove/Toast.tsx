"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastCtx = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 right-4 z-[999] flex flex-col gap-2 md:bottom-6 md:right-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl transition-all duration-300 ${
              t.type === "error"
                ? "border-rose-500/30 bg-rose-950/90 text-rose-100"
                : t.type === "success"
                  ? "border-teal-400/30 bg-teal-950/90 text-teal-100"
                  : "border-white/15 bg-nove-graphite/95 text-slate-100"
            }`}
          >
            <span className="mt-0.5 text-base leading-none" aria-hidden>
              {t.type === "error" ? "✕" : t.type === "success" ? "✓" : "·"}
            </span>
            <p className="text-sm leading-relaxed">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
