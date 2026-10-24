import { NativeModule, requireNativeModule } from 'expo';

import type { PushRegistration, StoredInsight } from './InsightNative.types';

declare class InsightNativeModule extends NativeModule {
  /** Reads the insight shared with the widget. */
  getInsight(): StoredInsight | null;
  /** Replaces the insight shared with the widget and redraws the widget. */
  setInsight(insight: StoredInsight): void;
  /** Null until the OS has issued a push token (or, on Android, while Firebase isn't configured). */
  getPushRegistrationAsync(): Promise<PushRegistration | null>;
}

export default requireNativeModule<InsightNativeModule>('InsightNative');
