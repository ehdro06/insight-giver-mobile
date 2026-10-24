import { API_URL } from './config';

const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Account = { accountId: string; token: string };

export type DeviceCheckIn = {
  platform: 'IOS' | 'ANDROID';
  pushToken: string | null;
  timeZone: string;
};

export type EntryUpload = { clientId: string; content: string; writtenAt: string };

export type RemoteInsight = { id: string; body: string; createdAt: string };

async function request<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<T | undefined> {
  const { method = 'GET', token, body } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(response.status, `${method} ${path} failed with HTTP ${response.status}`);
    }
    return response.status === 204 ? undefined : ((await response.json()) as T);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  async createAccount(timeZone: string): Promise<Account> {
    const account = await request<Account>('/api/v1/accounts', { method: 'POST', body: { timeZone } });
    if (!account) {
      throw new ApiError(500, 'Account creation returned no body');
    }
    return account;
  },

  async checkIn(token: string, device: DeviceCheckIn): Promise<void> {
    await request('/api/v1/me/device', { method: 'PUT', token, body: device });
  },

  /** Idempotent per clientId, so retrying after a lost response is safe. */
  async uploadEntry(token: string, entry: EntryUpload): Promise<void> {
    await request('/api/v1/entries', { method: 'POST', token, body: entry });
  },

  /** Undefined until the first insight has been written. */
  latestInsight(token: string): Promise<RemoteInsight | undefined> {
    return request<RemoteInsight>('/api/v1/insights/latest', { token });
  },
};
