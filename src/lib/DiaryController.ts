import * as Crypto from 'expo-crypto';

import { DeliverySettings } from './delivery';
import { timeline, type Insight, type SqliteDiary, type TimelineItem } from './diary';
import { sync, SyncQueue } from './sync';
import { revealWidgetInsight } from './widget';

/**
 * The diary as the UI sees it: a timeline snapshot (for useSyncExternalStore) plus the actions
 * that change it. Writes go to SQLite first and upload in the background, so writing never waits
 * on the network.
 */
export class DiaryController {
  private snapshot: TimelineItem[] = [];
  private readonly listeners = new Set<() => void>();
  private hasUnsynced = false;
  private readonly syncs: SyncQueue;
  /** When the daily insight arrives. */
  readonly delivery: DeliverySettings;

  constructor(
    private readonly diary: SqliteDiary,
    timeZone: () => string,
  ) {
    this.delivery = new DeliverySettings(timeZone);
    this.syncs = new SyncQueue(
      (full) => sync(diary, timeZone(), { full }),
      () => void this.reload(),
    );
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): TimelineItem[] => this.snapshot;

  /** Runs on launch and whenever the app returns to the foreground. */
  onForeground = async (): Promise<void> => {
    // A push may have delivered an insight while the app was closed.
    const stored = revealWidgetInsight();
    if (stored) {
      await this.diary.saveInsight({ id: stored.id, body: stored.body, createdAt: stored.createdAt });
    }
    await this.reload();
    await this.syncs.request(true);
  };

  write = async (content: string): Promise<void> => {
    await this.diary.addEntry({
      clientId: Crypto.randomUUID(),
      content,
      writtenAt: new Date().toISOString(),
      syncedAt: null,
    });
    await this.reload();
    void this.syncs.request(false);
  };

  /** Adds an insight (e.g. one opened from the widget) to the timeline. */
  remember = async (insight: Insight): Promise<void> => {
    if (await this.diary.saveInsight(insight)) {
      await this.reload();
    }
  };

  /** Uploads entries that are still waiting, if any. */
  retryPending = (): void => {
    if (this.hasUnsynced) {
      void this.syncs.request(false);
    }
  };

  private async reload(): Promise<void> {
    const [entries, insights] = await Promise.all([this.diary.entries(), this.diary.insights()]);
    this.hasUnsynced = entries.some((entry) => entry.syncedAt === null);
    this.snapshot = timeline(entries, insights);
    this.listeners.forEach((listener) => listener());
  }
}
