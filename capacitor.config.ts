import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Permanent once submitted to either store.
  appId: 'com.hairsalonix.app',
  appName: 'Hairsalonix',

  // Not used to render content (see server.url) but Capacitor requires it.
  webDir: 'public',

  server: {
    // Loads the live website, so site updates reach the app automatically.
    url: 'https://www.hairsalonix.com',
    cleartext: false,
  },

  ios: {
    contentInset: 'automatic',
  },

  // The website hides the splash itself once the page has loaded
  // (components/NativeAppBridge.tsx), so launchAutoHide stays false.
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#7F2D4A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#FAF6F3',
      splashFullScreen: true,
      splashImmersive: true,
    },
    // No SocialLogin: Hairsalonix signs in with email only.
  },
};

export default config;
