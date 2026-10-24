import { Platform } from 'react-native';

import InsightNative from '../../modules/insight-native';

import { accountToken, forgetAccount } from './account';
import { api, ApiError } from './api';
import type { DiaryStore, Insight } from './diary';
import { showOnWidget } from './widget';

const BATCH_SIZE = 50;

export type SyncResult = { uploaded: number; newInsight: Insight | null };

/**
 * Brings this device and the backend up to date. A full sync also checks the device in (push
 * token and time zone, which decide when insights arrive) and pulls the latest insight; a quick
 * one only uploads entries written since the last sync.
 */
export async function sync(store: DiaryStore, timeZone: string, { full }: { full: boolean }): Promise<SyncResult> {
  try {
    return await syncWithToken(store, await accountToken(timeZone), timeZone, full);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // The backend no longer knows this device (e.g. its database was reset). Start over as a
      // new account and upload the whole diary again, so recall still has every memory.
      await forgetAccount();
      await store.markAllUnsynced();
      return syncWithToken(store, await accountToken(timeZone), timeZone, true);
    }
    throw error;
  }
}

/**
 * Runs syncs one at a time. Requests made while one runs are coalesced into a single follow-up
 * run (full if any of them asked for full), so an entry written mid-sync is never left behind.
 */
export class SyncQueue {
  private running: Promise<void> | null = null;
  private queued: 'none' | 'quick' | 'full' = 'none';

  constructor(
    private readonly run: (full: boolean) => Promise<unknown>,
    private readonly onSettled: () => void,
  ) {}

  request(full: boolean): Promise<void> {
    if (this.running) {
      this.queued = full || this.queued === 'full' ? 'full' : 'quick';
      return this.running;
    }
    this.running = this.run(full)
      .then(
        () => undefined,
        (error: unknown) => console.warn('Sync failed, will retry', error),
      )
      .finally(() => {
        this.running = null;
        this.onSettled();
        const next = this.queued;
        this.queued = 'none';
        if (next !== 'none') {
          void this.request(next === 'full');
        }
      });
    return this.running;
  }
}

async function syncWithToken(store: DiaryStore, token: string, timeZone: string, full: boolean): Promise<SyncResult> {
  if (full) {
    await api.checkIn(token, {
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      pushToken: await InsightNative.getPushTokenAsync(),
      timeZone,
    });
  }

  let uploaded = 0;
  for (let batch = await store.unsyncedEntries(BATCH_SIZE); batch.length > 0; batch = await store.unsyncedEntries(BATCH_SIZE)) {
    for (const entry of batch) {
      await api.uploadEntry(token, { clientId: entry.clientId, content: entry.content, writtenAt: entry.writtenAt });
      await store.markSynced(entry.clientId, new Date().toISOString());
      uploaded++;
    }
  }

  let newInsight: Insight | null = null;
  if (full) {
    const latest = await api.latestInsight(token);
    if (latest) {
      showOnWidget(latest);
      if (await store.saveInsight(latest)) {
        newInsight = latest;
      }
    }
  }
  return { uploaded, newInsight };
}
