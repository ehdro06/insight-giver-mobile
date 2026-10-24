# Insight Giver mobile

Expo SDK 58 app for the Insight Giver diary. README.md explains the architecture; this file is the
working agreement. Expo's own guidance for agents:

@AGENTS.md

## Commands

```sh
npm run typecheck && npm run lint && npm test
npx expo prebuild --no-install --clean   # after touching app.config.ts, a config plugin or targets/
```

`npx expo install` needs api.expo.dev for version data; offline, `EXPO_OFFLINE=1 npx expo install <pkg>`
resolves SDK-compatible versions from the installed `expo` package.

## Rules for this project

- Never create or edit files under `ios/` or `android/`; they are regenerated. Native code goes in
  `modules/insight-native/{ios,android}` or `targets/widget`; app-level native settings go in
  `modules/insight-native/app.plugin.js` or `app.config.ts`.
- Insight pushes must be handled in native code without starting React Native: no headless JS, no
  JS background tasks, no notification libraries that boot the JS runtime (expo-notifications,
  @react-native-firebase/messaging). The prebuild tripwire in `app.plugin.js` guards the iOS side.
- Pushes reach iOS straight from the backend through APNs, and Android through FCM. Firebase is an
  Android-only dependency; keep it out of the iOS pod.
- The stored-insight JSON (`id`, `body`, `preview`, `createdAt`, `revealed`) is written and read in
  four places: `modules/insight-native/ios/InsightStore.swift`, `targets/widget/InsightWidget.swift`,
  `modules/insight-native/android/.../InsightStore.kt` and `modules/insight-native/src`. Change them
  together. The push keys come from the backend's `InsightPayload`.
- The widget's partial "teaser" view is deliberate (it gets people to open the app, which keeps
  background pushes from being throttled). Don't make the widget show the full text when `preview`
  is set and the insight isn't revealed.
- Keep business logic out of React components: `DiaryController` owns state and actions, screens
  read it through `useDiary()`. Routes live in `src/app/` only.
