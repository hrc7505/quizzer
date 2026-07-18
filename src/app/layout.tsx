import type { Metadata, Viewport } from "next";
import { Winky_Sans } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import "@/styles/globals.css";
import { Providers } from "@/components/providers/Providers";

const winkySans = Winky_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-winky",
  adjustFontFallback: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: {
    default: "Quizzer",
    template: "%s | Quizzer",
  },
  description: "Generate interactive quizzes and detailed AI explanations instantly. Study smarter with AI-powered multiple-choice quizzes.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://quizzer.vercel.app",
    siteName: "Quizzer",
    title: "Quizzer - AI-Powered Interactive Quizzes",
    description: "Generate interactive quizzes and detailed AI explanations instantly. Study smarter with AI-powered multiple-choice quizzes.",
    images: [
      {
        url: "/quizzer.svg",
        width: 833,
        height: 280,
        alt: "Quizzer Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quizzer - AI-Powered Interactive Quizzes",
    description: "Generate interactive quizzes and detailed AI explanations instantly.",
    images: ["/quizzer.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizzer",
  },
  icons: {
    icon: [
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/web-app-manifest-192x192.png", sizes: "192x192" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${winkySans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased" id="__next_ssr_loader_body">
        <Providers>
          <NextTopLoader
            color="#4f46e5"
            height={3}
            showSpinner={false}
            shadow={false}
            initialPosition={0}
          />
          {children}
        </Providers>
        {/* Service Worker Registration */}
        <Script id="service-worker-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.error('SW registration failed:', err);
                });
              });
            }
          `}
        </Script>
        <Script id="ssr-loader-hide" strategy="afterInteractive">
          {`
            (function() {
              var body = document.body;
              function hide() {
                body.classList.add('ssr-loader-done');
              }
              if (document.readyState === 'complete') {
                hide();
              } else {
                window.addEventListener('load', hide);
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
