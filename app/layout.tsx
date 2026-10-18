import "./globals.css";
import Providers from "@/components/SessionProviderWrapper";
import NativeAppBridge from "@/components/NativeAppBridge";

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
  themeColor: "#c4c1c3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Marks the page as running inside the iOS/Android app as early as possible,
            so app-only / web-only bits never flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var c=window.Capacitor;if((c&&c.isNativePlatform&&c.isNativePlatform())||/HairsalonixApp/.test(navigator.userAgent)){document.documentElement.classList.add('native-app')}}catch(e){}",
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NativeAppBridge />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
