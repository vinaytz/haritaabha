import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** GA4. Loads only when NEXT_PUBLIC_GA_ID is set. E-commerce events go through lib/track.ts. */
export function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
