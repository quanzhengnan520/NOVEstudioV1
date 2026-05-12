type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, subtitle, align = "left" }: Props) {
  const a = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`max-w-2xl ${a}`}>
      {eyebrow ? <p className={`nove-eyebrow ${a}`}>{eyebrow}</p> : null}
      <h2 className={`nove-section-title mt-3 ${a}`}>{title}</h2>
      {subtitle ? <p className={`nove-description mt-4 text-sm sm:text-base ${a}`}>{subtitle}</p> : null}
    </div>
  );
}
