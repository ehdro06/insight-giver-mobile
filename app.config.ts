/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

// Change before the first store release: bundle ids can't change afterwards, and the App Group
// must be registered for this id in the Apple Developer portal.
const bundleIdentifier = process.env.APP_BUNDLE_ID ?? 'com.insightgiver.app';
const appGroup = `group.${bundleIdentifier}`;

// Android pushes go through FCM, which needs the Firebase project's google-services.json. It stays
// out of git: EAS can provide it as a file environment variable; locally, drop it next to this
// file. Without it the app still runs, it just never receives pushes on Android.
function optionalFile(envName: string, fallback: string): string | undefined {
  const file = process.env[envName] ?? fallback;
  return fs.existsSync(path.resolve(__dirname, file)) ? file : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Insight Giver',
  slug: 'insight-giver',
  scheme: 'insightgiver',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier,
    // Needed to sign the widget extension; find it in Xcode or the Apple Developer portal.
    appleTeamId: process.env.APPLE_TEAM_ID,
    supportsTablet: false,
    entitlements: {
      // Shared with the widget target (targets/widget/expo-target.config.js).
      'com.apple.security.application-groups': [appGroup],
    },
  },
  android: {
    package: bundleIdentifier,
    googleServicesFile: optionalFile('GOOGLE_SERVICES_JSON', './google-services.json'),
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-sqlite',
    'expo-secure-store',
    'expo-localization',
    ['./modules/insight-native/app.plugin.js', { appGroup }],
    '@bacons/apple-targets',
  ],
});
