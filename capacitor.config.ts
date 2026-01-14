import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.djitoe.tracking',
  appName: 'Djitoe Tracking',
  webDir: 'out', // <--- INI PERBAIKANNYA (Sebelumnya mungkin 'public' atau 'www')
};

export default config;