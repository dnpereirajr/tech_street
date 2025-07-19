import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streettech.downloader',
  appName: 'Street Tech Downloader',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-7984194482199524~4445742891', // ID do app no AdMob
      testingDevices: ['a9473331-759b-4b8e-9191-8f5c21f69958'],
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false
    }
  }
}

import { AdMob } from '@capacitor-community/admob';

export class MobileAdService {
  async initialize() {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: ['a9473331-759b-4b8e-9191-8f5c21f69958'],
    });
  }

  async showBanner() {
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.TOP,
    });
  }

  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3940256099942544/1033173712',
    });
    await AdMob.showInterstitial();
  }
};

export default config;