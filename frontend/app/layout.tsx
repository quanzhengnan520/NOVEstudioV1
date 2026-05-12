import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/storage";
import { htmlLang, isLocale, type Locale } from "@/lib/i18n/types";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVE Studio",
  description: "NOVE Studio — AI video, image, and chat workspace. Create cinematic visuals in seconds.",
};

function readInitialLocale(): Locale | null {
  const raw = cookies().get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(raw) ? raw : null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = readInitialLocale();
  const htmlLangAttr = htmlLang(initialLocale ?? "zh");

  return (
    <html lang={htmlLangAttr} suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
