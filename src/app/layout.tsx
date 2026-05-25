import type { Metadata } from "next";
import { Fraunces, Geist_Mono } from "next/font/google";
import { ThemeProvider, Toaster } from "@beeads/ui";
import "./globals.css";

// Note: Next.js requires next/font loaders to be called in user code (not node_modules).
// Spec matches @beeads/fonts exactly (Fraunces with opsz/SOFT/WONK axes + Geist_Mono).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "agentes·beeads",
  description: "Console da plataforma Semente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-mono">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
