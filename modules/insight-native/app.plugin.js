const { withAppDelegate, withEntitlementsPlist, withInfoPlist } = require('expo/config-plugins');

/**
 * App-level native configuration for the insight-native module. The module's Swift and Kotlin
 * code is autolinked from modules/insight-native; this plugin only sets what has to live in the
 * generated app project, so nothing is ever edited by hand under ios/ or android/.
 *
 * @param {import('expo/config').ExpoConfig} config
 * @param {{ appGroup: string, apsEnvironment?: 'development' | 'production' }} props
 */
function withInsightNative(config, { appGroup, apsEnvironment = 'development' } = {}) {
  if (!appGroup) {
    throw new Error('insight-native: the `appGroup` option is required');
  }

  config = withInfoPlist(config, (mod) => {
    // Read by the module and, through the containing app's bundle, by the widget extension.
    mod.modResults.InsightGiverAppGroup = appGroup;
    // Lets silent pushes wake the app in the background.
    mod.modResults.UIBackgroundModes = [
      ...new Set([...(mod.modResults.UIBackgroundModes ?? []), 'remote-notification']),
    ];
    // InsightAppDelegateSubscriber hands the APNs token to Firebase itself.
    mod.modResults.FirebaseAppDelegateProxyEnabled = false;
    return mod;
  });

  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['aps-environment'] ??= apsEnvironment;
    mod.modResults['com.apple.security.application-groups'] = [
      ...new Set([...(mod.modResults['com.apple.security.application-groups'] ?? []), appGroup]),
    ];
    return mod;
  });

  config = withAppDelegate(config, (mod) => {
    assertReactNativeWaitsForAScene(mod.modResults.contents);
    return mod;
  });

  return config;
}

/**
 * The native push bypass depends on React Native starting only when a UI scene connects, which a
 * silent push never does (Expo SDK 58's SceneDelegate). If a template change ever starts React
 * Native in application(_:didFinishLaunchingWithOptions:) again, every background push would boot
 * the JavaScript engine, so fail the prebuild rather than ship that.
 */
function assertReactNativeWaitsForAScene(appDelegate) {
  if (/startReactNative\s*\(/.test(appDelegate)) {
    throw new Error(
      'insight-native: AppDelegate starts React Native at launch, so every silent push would boot ' +
        'JavaScript in the background. Start it from the scene delegate (as the Expo SDK 58 template ' +
        'does), or skip it while application.applicationState == .background.',
    );
  }
}

module.exports = withInsightNative;
