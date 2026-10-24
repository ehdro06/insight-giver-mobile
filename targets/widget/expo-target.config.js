// Linked into the Xcode project by @bacons/apple-targets on `expo prebuild`, so the Swift sources in
// this folder never live under ios/.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'InsightWidget',
  displayName: 'Insight',
  // Becomes <app bundle id>.widget
  bundleIdentifier: '.widget',
  // containerBackground(for: .widget) needs iOS 17; older devices simply don't offer the widget.
  deploymentTarget: '17.0',
  entitlements: {
    // The app's App Group (app.config.ts): the widget reads the insight the app stores there.
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
  colors: {
    $widgetBackground: { light: '#FFF3DC', dark: '#2D2617' },
    $accent: { light: '#B9822B', dark: '#E0A84B' },
    insightText: { light: '#3B2F1B', dark: '#F2E6CF' },
  },
});
