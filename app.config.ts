/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

// Change before the first store release: bundle ids can't change afterwards, and the App Group
// must be registered for this id in the Apple Developer portal.
const bundleIdentifier = process.env.APP_BUNDLE_ID ?? 'com.insightgiver.app';
const appGroup = `group.${bundleIdentifier}`;

// Firebase config files are per project and stay out of git. EAS can provide them as file
// environment variables; locally, drop them next to this file. Without them the app still runs,
// it just never receives pushes.
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
    googleServicesFile: optionalFile('GOOGLE_SERVICE_INFO_PLIST', './GoogleService-Info.plist'),
    entitlements: {
      // Declared here (not only in the plugin) so @bacons/apple-targets mirrors it onto the widget.
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
    // Firebase's iOS pods only build as frameworks.
    ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
    ['./modules/insight-native/app.plugin.js', { appGroup }],
    '@bacons/apple-targets',
  ],
});
