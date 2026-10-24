import * as SecureStore from 'expo-secure-store';

import { api } from './api';

const TOKEN_KEY = 'insight-giver.account-token';

let pending: Promise<string> | null = null;

/**
 * The device's bearer token. The first call registers an anonymous account, so there is nothing
 * to sign up for. Concurrent callers share one registration.
 */
export function accountToken(timeZone: string): Promise<string> {
  pending ??= (async () => {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) {
      return stored;
    }
    const account = await api.createAccount(timeZone);
    await SecureStore.setItemAsync(TOKEN_KEY, account.token);
    return account.token;
  })().finally(() => {
    pending = null;
  });
  return pending;
}

/** Drops a token the backend no longer accepts; the next {@link accountToken} registers again. */
export async function forgetAccount(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
