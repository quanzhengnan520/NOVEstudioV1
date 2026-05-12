"use client";

type Chip<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  label?: string;
  chips: Chip<T>[];
  value: T | null;
  onChange: (id: T) => void;
  className?: string;
  /** Center label + chips (studio stage layout) */
  center?: boolean;
  /** Tighter chips for control strips */
  compact?: boolean;
};

export function AiChipRow<T extends string>({
  label,
  chips,
  value,
  onChange,
  className = "",
  center = false,
  compact = false,
}: Props<T>) {
  const chipClass = compact ? "nove-chip nove-chip-compact" : "nove-chip";
  return (
    <div className={className}>
      {label ? (
        <p
          className={`${compact ? "mb-1.5" : "mb-2.5"} text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 ${center ? "text-center" : "text-center md:text-left"}`}
        >
          {label}
        </p>
      ) : null}
      <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"} ${center ? "justify-center" : "justify-center md:justify-start"}`}>
        {chips.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`${chipClass} ${on ? "nove-chip-active" : ""}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
