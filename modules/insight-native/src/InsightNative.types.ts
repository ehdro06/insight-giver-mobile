/**
 * The latest insight as stored for the home-screen widget (App Group UserDefaults on iOS,
 * SharedPreferences on Android). Native push handlers write it without starting React Native;
 * the app reads it when opened and marks it revealed.
 */
export type StoredInsight = {
  id: string;
  body: string;
  /** Truncated teaser the widget shows instead of `body` until the app has been opened. */
  preview: string | null;
  createdAt: string;
  revealed: boolean;
};

/** Where the backend sends this install's pushes: FCM on Android, APNs on iOS. */
export type PushRegistration = {
  token: string;
  /** iOS only: development-signed builds get APNs sandbox tokens. */
  apnsEnvironment: 'SANDBOX' | 'PRODUCTION' | null;
};
