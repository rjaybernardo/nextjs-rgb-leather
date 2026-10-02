import type { Metadata } from "next";
import {
  Inter,
  Lora,
  Montserrat,
  Playfair_Display,
  Poppins,
} from "next/font/google";

import ThemeProvider from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

import { SERVER_URL } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site";
import { contrastText, radiusRem, type SiteSettings } from "@/lib/site-config";

// Fonts offered in Site Studio → Theme. Only the chosen one is used by CSS,
// so browsers only download that one.
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false });

const FONT_CLASS: Record<SiteSettings["theme"]["font"], string> = {
  inter: inter.className,
  poppins: poppins.className,
  montserrat: montserrat.className,
  lora: lora.className,
  playfair: playfair.className,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: {
      template: `%s | ${settings.siteName}`,
      default: settings.tagline
        ? `${settings.siteName} | ${settings.tagline}`
        : settings.siteName,
    },
    description: settings.description,
    metadataBase: new URL(SERVER_URL),
    openGraph: {
      siteName: settings.siteName,
      locale: "en_PH",
      type: "website",
      ...(settings.ogImageUrl ? { images: [{ url: settings.ogImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

// Brand color and corner roundness from Site Studio, layered over globals.css
const themeCss = ({ theme }: SiteSettings) => {
  const foreground = contrastText(theme.primaryColor);

  return `:root,.dark{--primary:${theme.primaryColor};--primary-foreground:${foreground};--ring:${theme.primaryColor};--radius:${radiusRem(theme.radius)};}`;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Values are validated (hex color, fixed radius list), not free text */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />
      </head>

      <body className={FONT_CLASS[settings.theme.font]}>
        {/* Lets keyboard users jump past the header */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md focus:outline-2 focus:outline-ring"
        >
          Skip to content
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme={settings.theme.defaultMode}
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
