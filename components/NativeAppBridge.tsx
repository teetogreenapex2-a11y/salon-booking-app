"use client";

import { useEffect } from "react";

// Runs only inside the Hairsalonix iOS/Android app (a Capacitor shell that
// loads this website). On normal browsers it does nothing.
//  - Hides the native splash screen once the page has actually loaded
//    (the shell is set to NOT auto-hide it).
//  - Marks <html class="native-app"> so styles can adapt.
//  (The admin menu hides the website's own bottom bar by itself once the
//  native tab bar has taken over - see AdminNav.)
export default function NativeAppBridge() {
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
  return null;
}
