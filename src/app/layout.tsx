import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/utils/language-context";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { FaGithub, FaDiscord, FaXTwitter } from "react-icons/fa6";
import { SiHuggingface } from "react-icons/si";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

// Define base URL for canonical links
const baseUrl = "https://deep-research.apps.opentyphoon.ai";

export const metadata: Metadata = {
  title: {
    template: '%s | Typhoon Deep Research',
    default: 'Typhoon Deep Research - AI-Powered Comprehensive Research Tool',
  },
  description: "Experience Typhoon's advanced AI research capabilities. Conduct deep, comprehensive research on any topic with our powerful multi-step research and analysis engine.",
  keywords: ["Typhoon AI", "AI research", "deep research", "comprehensive research", "AI-powered research", "Typhoon demo", "research assistant"],
  authors: [{ name: "Typhoon AI", url: "https://opentyphoon.ai" }],
  creator: "Typhoon AI",
  publisher: "Typhoon AI",
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: new URL(baseUrl),
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Typhoon Deep Research',
    title: 'Typhoon Deep Research - AI-Powered Comprehensive Research Tool',
    description: "Experience Typhoon's advanced AI research capabilities. Conduct deep, comprehensive research on any topic with our powerful multi-step research and analysis engine.",
    images: [
      {
        url: `${baseUrl}/images/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Typhoon Deep Research',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@opentyphoon',
    creator: '@opentyphoon',
    title: 'Typhoon Deep Research - AI-Powered Comprehensive Research Tool',
    description: "Experience Typhoon's advanced AI research capabilities. Conduct deep, comprehensive research on any topic with our powerful multi-step research and analysis engine.",
    images: `${baseUrl}/images/og.jpg`,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Typhoon Deep Research",
              "applicationCategory": "ResearchApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Experience Typhoon's advanced AI research capabilities. Conduct deep, comprehensive research on any topic with our powerful multi-step research and analysis engine.",
              "url": "https://opentyphoon.ai",
              "author": {
                "@type": "Organization",
                "name": "Typhoon AI",
                "url": "https://opentyphoon.ai"
              },
              "potentialAction": {
                "@type": "UseAction",
                "target": "https://deep-research.apps.opentyphoon.ai"
              }
            })
          }}
        />
        <Script id="gtm-script">
          {`
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-WK925XWL');
    `}
        </Script>
      </head>
      <body className={inter.className}>
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WK925XWL"
            height={0} width={0} style={{ display: 'none', visibility: 'hidden' }}></iframe>
        </noscript>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
          <LanguageProvider>
            <Navigation />
            <div className="pt-20">
              {children}
            </div>
          </LanguageProvider>

          {/* Footer */}
          <footer className="w-full bg-white py-8 border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <a
                    href="https://opentyphoon.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-purple-600 hover:text-purple-700"
                  >
                    #BuiltWithTyphoon
                  </a>
                </div>

                <div className="mb-4 md:mb-0">
                  <a
                    href="https://opentyphoon.ai/tac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Terms and Conditions
                  </a>
                </div>

                <div className="flex space-x-5">
                  <a
                    href="https://github.com/scb-10x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="GitHub"
                  >
                    <FaGithub className="w-5 h-5" />
                  </a>
                  <a
                    href="https://discord.gg/9F6nrFXyNt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Discord"
                  >
                    <FaDiscord className="w-5 h-5" />
                  </a>
                  <a
                    href="https://huggingface.co/scb10x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Hugging Face"
                  >
                    <SiHuggingface className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/opentyphoon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="X (Twitter)"
                  >
                    <FaXTwitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
