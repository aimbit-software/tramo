import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { getStoredTheme } from "@/features/theme/queries";

import "./globals.css";

// IBM Plex Sans (body) and IBM Plex Mono (display, labels, numbers): two
// members of one superfamily, so they harmonize by construction. Only the two
// weights the system uses ship — an unused weight isn't reserved, it's paid
// for on every visit. next/font self-hosts them at build time.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("name"), description: t("description") };
}

/**
 * The theme is resolved on the server from cookies and written straight onto
 * <html>, so the first paint is already right: no bootstrap script, no flash.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), getStoredTheme()]);

  return (
    <html
      lang={locale}
      data-palette={theme.palette}
      data-theme={theme.mode}
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
