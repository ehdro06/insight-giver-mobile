import { getCalendars } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { SqliteDiary, type Insight, type TimelineItem } from './diary';
import { DiaryController } from './DiaryController';

/** While entries are waiting to upload and the app is open, retry this often. */
const RETRY_INTERVAL_MS = 60_000;

const DiaryContext = createContext<DiaryController | null>(null);

function deviceTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? 'UTC';
}

export function DiaryProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const controller = useMemo(() => new DiaryController(new SqliteDiary(db), deviceTimeZone), [db]);

  useEffect(() => {
    void controller.onForeground();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void controller.onForeground();
      }
    });
    const retry = setInterval(() => {
      if (AppState.currentState === 'active') {
        controller.retryPending();
      }
    }, RETRY_INTERVAL_MS);
    return () => {
      subscription.remove();
      clearInterval(retry);
    };
  }, [controller]);

  return <DiaryContext value={controller}>{children}</DiaryContext>;
}

export function useDiary(): {
  items: TimelineItem[];
  write: (content: string) => Promise<void>;
  remember: (insight: Insight) => Promise<void>;
} {
  const controller = use(DiaryContext);
  if (!controller) {
    throw new Error('useDiary must be used inside <DiaryProvider>');
  }
  const items = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  return { items, write: controller.write, remember: controller.remember };
}
