import { getCalendars } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { Delivery, DeliveryState } from './delivery';
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

function useController(): DiaryController {
  const controller = use(DiaryContext);
  if (!controller) {
    throw new Error('Diary hooks must be used inside <DiaryProvider>');
  }
  return controller;
}

export function useDiary(): {
  items: TimelineItem[];
  write: (content: string) => Promise<void>;
  remember: (insight: Insight) => Promise<void>;
} {
  const controller = useController();
  const items = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  return { items, write: controller.write, remember: controller.remember };
}

/** When the daily insight arrives; `load` fetches it from the backend. */
export function useDelivery(): {
  state: DeliveryState;
  load: () => Promise<void>;
  choose: (delivery: Delivery) => Promise<void>;
} {
  const { delivery } = useController();
  const state = useSyncExternalStore(delivery.subscribe, delivery.getSnapshot);
  return { state, load: delivery.load, choose: delivery.choose };
}
