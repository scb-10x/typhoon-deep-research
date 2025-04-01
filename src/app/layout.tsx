import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/utils/language-context";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { FaGithub, FaDiscord, FaXTwitter } from "react-icons/fa6";
import { SiHuggingface } from "react-icons/si";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Typhoon Deep Research",
  description: "An advanced AI-powered research tool that helps you conduct deep, comprehensive research on any topic.",
  icons: {
    icon: '/favicon.ico',
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
      </head>
      <body className={inter.className}>
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
