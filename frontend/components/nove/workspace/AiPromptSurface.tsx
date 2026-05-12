"use client";

import type { TextareaHTMLAttributes } from "react";

type Props = {
  label?: string;
  /** Larger, more cinematic surface for studio hero prompts */
  variant?: "default" | "stage";
  /** Fires when the textarea gains/loses focus — for studio “focus mode” ambience */
  onFocusAmbient?: (focused: boolean) => void;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AiPromptSurface({
  label,
  variant = "default",
  className = "",
  onFocusAmbient,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const isStage = variant === "stage";
  return (
    <div
      className={`nove-prompt-surface group/prompt ${isStage ? "nove-prompt-surface--stage shadow-[0_0_0_1px_rgba(94,234,212,0.08)_inset]" : ""}`}
    >
      {isStage ? (
        <>
          <div className="pointer-events-none absolute -left-24 top-1/3 h-48 w-48 rounded-full bg-teal-400/12 blur-[56px] transition duration-700 group-hover/prompt:bg-teal-400/18" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-violet-500/14 blur-[52px] transition duration-700 group-hover/prompt:bg-violet-500/20" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)] opacity-80" />
        </>
      ) : null}
      {label ? (
        <div className="relative border-b border-white/[0.06] px-5 pb-2 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</span>
        </div>
      ) : null}
      <textarea
        className={`relative z-[1] w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none md:text-base ${isStage ? "min-h-[min(42vh,340px)] max-h-[min(52vh,440px)] text-base md:min-h-[min(38vh,360px)] md:text-[17px]" : "min-h-[180px] max-h-[220px] md:min-h-[200px]"} ${className}`}
        spellCheck={false}
        onFocus={(e) => {
          onFocus?.(e);
          onFocusAmbient?.(true);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          onFocusAmbient?.(false);
        }}
        {...rest}
      />
    </div>
  );
}
