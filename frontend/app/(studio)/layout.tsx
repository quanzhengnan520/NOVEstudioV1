import type { Metadata } from "next";
import { ClientShell } from "@/components/studio/ClientShell";

export const metadata: Metadata = {
  title: "Studio",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
