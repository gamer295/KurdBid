import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kurdbid.app',
  appName: 'KurdBid',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
