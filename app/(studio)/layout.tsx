import { getCategoryCounts } from "@/lib/studio/server-data";
import { StudioShell } from "@/components/layout/studio-shell";

export const dynamic = "force-dynamic";

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categoryCounts = getCategoryCounts();

  return <StudioShell categoryCounts={categoryCounts}>{children}</StudioShell>;
}
