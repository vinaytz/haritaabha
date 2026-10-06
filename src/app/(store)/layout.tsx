import { SiteHeader } from "@/components/store/header";
import { SiteFooter } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { getSettings } from "@/server/settings";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-paper focus:px-4 focus:py-2 focus:shadow-float">
        Skip to content
      </a>
      {settings.announcement && (
        <div className="bg-canopy text-white">
          <p className="container-page py-2 text-center text-[0.8125rem] text-white/85">{settings.announcement}</p>
        </div>
      )}
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
    </>
  );
}
