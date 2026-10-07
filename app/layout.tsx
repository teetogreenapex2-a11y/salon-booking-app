import "./globals.css";
import Providers from "@/components/SessionProviderWrapper";

export const metadata = {
  title: "Book an appointment",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Hairsalonix", statusBarStyle: "default" },
};

// viewport-fit=cover lets the bottom tab bar's safe-area padding actually
// apply on phones with a home indicator; without it env(safe-area-inset-*)
// is always 0 and the bar sits cramped against the bottom edge.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d6bcc6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
