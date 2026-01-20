import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.djitoe.tracking',
  appName: 'Djitoe Tracking',
  webDir: 'out',
  server: {
    // 👇 PASTE LINK VERCEL ANDA DI SINI
    url: 'https://tracking-mesin.vercel.app', 
    cleartext: true
  }
};

export default config;