import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { getStoredTheme } from "@/features/theme/queries";
import { brandIconHref } from "@/lib/theme";

import "./globals.css";

// IBM Plex Sans (body) and IBM Plex Mono (labels, buttons, table numbers): two
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

// Big Shoulders: the poster voice. Ultra-condensed and heavy, for titles, the
// big numbers and the wordmark. Variable, so its one file covers every weight;
// its optical size axis tightens it further at display sizes.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
});

// The favicon is the logo in the person's theme: the tab changes with it.
export async function generateMetadata(): Promise<Metadata> {
  const [t, theme] = await Promise.all([getTranslations("app"), getStoredTheme()]);
  return {
    title: t("name"),
    description: t("description"),
    icons: { icon: { url: brandIconHref(theme), type: "image/svg+xml" } },
  };
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
      className={`${plexSans.variable} ${plexMono.variable} ${bigShoulders.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
