import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/utils/language-context";
import "./globals.css";

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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
          <LanguageProvider>
            {children}
          </LanguageProvider>
          
          {/* Footer */}
          <footer className="w-full bg-white dark:bg-gray-900 py-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="container mx-auto px-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Powered by <a href="http://opentyphoon.ai/" target="_blank" rel="noopener noreferrer" className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 hover:underline">Typhoon</a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
