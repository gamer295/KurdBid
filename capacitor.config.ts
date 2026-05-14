import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kurdbid.app',
  appName: 'KurdBid',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
      iosAppId: 'ca-app-pub-3940256099942544~1458002511',
    }
  }
};

export default config;
