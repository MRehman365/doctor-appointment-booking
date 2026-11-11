import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SupportWidget } from "@/components/layout/SupportWidget";
import { fetchSettings } from "@/lib/api/site";

async function FooterWithSettings() {
  try {
    const settings = await fetchSettings();
    return <SiteFooter settings={settings} />;
  } catch {
    return <SiteFooter />;
  }
}

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SupportWidget />
      <Suspense fallback={<SiteFooter />}>
        <FooterWithSettings />
      </Suspense>
    </>
  );
}
