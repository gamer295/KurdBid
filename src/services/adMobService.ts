import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class AdMobService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized || !Capacitor.isNativePlatform()) return;

    try {
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: true,
      });
      this.initialized = true;
      console.log('AdMob initialized');
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  }

  static async showBanner() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Banners only show on native platforms');
      return;
    }

    try {
      await this.initialize();

      const options: BannerAdOptions = {
        adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true
      };

      await AdMob.showBanner(options);
    } catch (error) {
      console.error('Error showing banner:', error);
    }
  }

  static async hideBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.error('Error hiding banner:', error);
    }
  }

  static async resumeBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.resumeBanner();
    } catch (error) {
      console.error('Error resuming banner:', error);
    }
  }

  static async removeBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
    } catch (error) {
      console.error('Error removing banner:', error);
    }
  }
}
