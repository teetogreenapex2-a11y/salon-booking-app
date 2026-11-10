"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Runs only inside the Hairsalonix iOS/Android app (a Capacitor shell that
// loads this website). On normal browsers it does nothing.
//  - Hides the native splash screen once the page has actually loaded
//    (the shell is set to NOT auto-hide it).
//  - Marks <html class="native-app"> so styles can adapt.
//  (The admin menu hides the website's own bottom bar by itself once the
//  native tab bar has taken over - see AdminNav.)
export default function NativeAppBridge() {
  const pathname = usePathname();
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const root = document.documentElement;
    root.classList.add("native-app");
    const hide = () => {
      try {
        cap.Plugins?.SplashScreen?.hide?.();
      } catch {}
    };
    hide();
    // Belt and braces: a second try in case the plugin bridge wasn't ready yet.
    const t = setTimeout(hide, 800);
    return () => clearTimeout(t);
  }, []);

  // Outside the admin area (e.g. the "you're booked" page) AdminNav is not on
  // the page, so nothing answers the native tab bar. Do it here with a normal
  // page load so the tabs always work.
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    const go = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (typeof href === "string" && href.startsWith("/admin")) window.location.href = href;
    };
    const more = () => {
      window.location.href = "/admin";
    };
    window.addEventListener("hx-navigate", go);
    window.addEventListener("hx-open-more", more);
    return () => {
      window.removeEventListener("hx-navigate", go);
      window.removeEventListener("hx-open-more", more);
    };
  }, [pathname]);
  return null;
}
