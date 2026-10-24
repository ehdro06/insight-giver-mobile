import InsightNative from '../../../modules/insight-native';
import { accountToken, forgetAccount } from '../account';
import { api, ApiError } from '../api';
import type { DiaryStore, Entry, Insight } from '../diary';
import { sync, SyncQueue } from '../sync';

jest.mock('../../../modules/insight-native', () => ({
  __esModule: true,
  default: { getInsight: jest.fn(), setInsight: jest.fn(), getPushTokenAsync: jest.fn() },
}));
jest.mock('../account', () => ({ accountToken: jest.fn(), forgetAccount: jest.fn() }));
jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  api: { checkIn: jest.fn(), uploadEntry: jest.fn(), latestInsight: jest.fn() },
}));

const native = jest.mocked(InsightNative);
const mockedApi = jest.mocked(api);

class MemoryDiary implements DiaryStore {
  entries: Entry[] = [];
  insights: Insight[] = [];

  async unsyncedEntries(limit: number) {
    return this.entries.filter((entry) => entry.syncedAt === null).slice(0, limit);
  }

  async markSynced(clientId: string, syncedAt: string) {
    this.entries = this.entries.map((entry) => (entry.clientId === clientId ? { ...entry, syncedAt } : entry));
  }

  async markAllUnsynced() {
    this.entries = this.entries.map((entry) => ({ ...entry, syncedAt: null }));
  }

  async saveInsight(insight: Insight) {
    if (this.insights.some((existing) => existing.id === insight.id)) {
      return false;
    }
    this.insights.push(insight);
    return true;
  }
}

const entry = (clientId: string, syncedAt: string | null = null): Entry => ({
  clientId,
  content: `thought ${clientId}`,
  writtenAt: '2026-10-22T10:00:00.000Z',
  syncedAt,
});

const insight: Insight = { id: 'insight-1', body: 'You keep coming back to the river.', createdAt: '2026-10-23T00:00:00Z' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(accountToken).mockResolvedValue('token-1');
  native.getPushTokenAsync.mockResolvedValue('fcm-token');
  native.getInsight.mockReturnValue(null);
  mockedApi.latestInsight.mockResolvedValue(undefined);
});

describe('sync', () => {
  it('uploads only entries that are not synced yet', async () => {
    const diary = new MemoryDiary();
    diary.entries = [entry('a', '2026-10-21T00:00:00Z'), entry('b'), entry('c')];

    const result = await sync(diary, 'Asia/Seoul', { full: false });

    expect(result.uploaded).toBe(2);
    expect(mockedApi.uploadEntry.mock.calls.map(([, upload]) => upload.clientId)).toEqual(['b', 'c']);
    expect(diary.entries.every((e) => e.syncedAt !== null)).toBe(true);
    expect(mockedApi.checkIn).not.toHaveBeenCalled();
    expect(mockedApi.latestInsight).not.toHaveBeenCalled();
  });

  it('keeps an entry pending when its upload fails', async () => {
    const diary = new MemoryDiary();
    diary.entries = [entry('a'), entry('b')];
    mockedApi.uploadEntry.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(sync(diary, 'UTC', { full: false })).rejects.toThrow('Network request failed');

    expect(diary.entries.map((e) => e.syncedAt !== null)).toEqual([true, false]);
  });

  it('checks the device in and catches up on the latest insight', async () => {
    const diary = new MemoryDiary();
    mockedApi.latestInsight.mockResolvedValue(insight);

    const result = await sync(diary, 'Asia/Seoul', { full: true });

    expect(mockedApi.checkIn).toHaveBeenCalledWith('token-1', {
      platform: 'IOS',
      pushToken: 'fcm-token',
      timeZone: 'Asia/Seoul',
    });
    expect(result.newInsight).toEqual(insight);
    expect(diary.insights).toEqual([insight]);
    expect(native.setInsight).toHaveBeenCalledWith({ ...insight, preview: null, revealed: true });
  });

  it('starts over as a new account when the backend no longer knows the token', async () => {
    const diary = new MemoryDiary();
    diary.entries = [entry('a', '2026-10-01T00:00:00Z')];
    jest.mocked(accountToken).mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token');
    mockedApi.checkIn.mockRejectedValueOnce(new ApiError(401, 'unauthorized'));

    const result = await sync(diary, 'UTC', { full: true });

    expect(forgetAccount).toHaveBeenCalled();
    expect(result.uploaded).toBe(1);
    expect(mockedApi.uploadEntry).toHaveBeenCalledWith('fresh-token', expect.objectContaining({ clientId: 'a' }));
  });
});

describe('SyncQueue', () => {
  it('runs one sync at a time and coalesces requests into a single full follow-up', async () => {
    const runs: boolean[] = [];
    let finishFirst!: () => void;
    const run = jest.fn((full: boolean) => {
      runs.push(full);
      return runs.length === 1 ? new Promise<void>((resolve) => (finishFirst = resolve)) : Promise.resolve();
    });
    const queue = new SyncQueue(run, () => {});

    const first = queue.request(false);
    void queue.request(false);
    void queue.request(true);
    expect(runs).toEqual([false]);

    finishFirst();
    await first;
    await new Promise((resolve) => setImmediate(resolve));

    expect(runs).toEqual([false, true]);
  });

  it('survives a failed sync', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onSettled = jest.fn();
    const queue = new SyncQueue(() => Promise.reject(new Error('offline')), onSettled);

    await queue.request(true);

    expect(onSettled).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
