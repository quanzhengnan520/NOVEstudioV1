const defaultChips = ["Video", "Image", "Chat", "Prompt", "Fast", "High Quality"] as const;

type Props = {
  chips?: readonly string[];
};

export function ModelChipBar({ chips = defaultChips }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {chips.map((label) => (
        <span
          key={label}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 shadow-inner-glow transition hover:border-teal-400/25 hover:text-white"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
