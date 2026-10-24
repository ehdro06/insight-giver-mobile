import { NativeModule, requireNativeModule } from 'expo';

import type { StoredInsight } from './InsightNative.types';

declare class InsightNativeModule extends NativeModule {
  /** Reads the insight shared with the widget. */
  getInsight(): StoredInsight | null;
  /** Replaces the insight shared with the widget and redraws the widget. */
  setInsight(insight: StoredInsight): void;
  /** FCM registration token, or null while Firebase isn't configured or has no token yet. */
  getPushTokenAsync(): Promise<string | null>;
}

export default requireNativeModule<InsightNativeModule>('InsightNative');
