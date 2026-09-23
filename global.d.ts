import type { LOCALE } from "@/i18n/config";
import type messages from "@/messages/es-AR.json";

// Type-safe message keys and locale for next-intl.
declare module "next-intl" {
  interface AppConfig {
    Locale: typeof LOCALE;
    Messages: typeof messages;
  }
}
