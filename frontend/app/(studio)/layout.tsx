import { ClientShell } from "@/components/studio/ClientShell";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
