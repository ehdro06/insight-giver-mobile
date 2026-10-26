import { accountToken } from './account';
import { api, type Delivery } from './api';

export type { Delivery, DeliveryMode } from './api';

export type DeliveryState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; delivery: Delivery; saving: boolean; failed: boolean };

// Mirror the backend's insight-giver.insights.delivery settings.
export const MORNING_TIME = '09:00';
export const SURPRISE_WINDOW = { from: '09:00', to: '21:00' } as const;
/** What a fixed time starts at before one is picked: evening, when people tend to look back. */
export const DEFAULT_FIXED_TIME = '21:00';
export const MINUTE_STEP = 15;

export function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

export function toTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const hourFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });

/** "9:00 PM" or "21:00", following the device's locale. */
export function formatTime(time: string): string {
  const { hour, minute } = parseTime(time);
  return timeFormat.format(new Date(2000, 0, 1, hour, minute));
}

/** "9 PM" or "21", for picking an hour. */
export function formatHour(hour: number): string {
  return hourFormat.format(new Date(2000, 0, 1, hour));
}

export function describe(delivery: Delivery): string {
  switch (delivery.mode) {
    case 'MORNING':
      return `Every morning at ${formatTime(MORNING_TIME)}`;
    case 'FIXED':
      return `Every day at ${formatTime(delivery.time ?? DEFAULT_FIXED_TIME)}`;
    case 'SURPRISE':
      return `A different time each day, between ${formatTime(SURPRISE_WINDOW.from)} and ${formatTime(SURPRISE_WINDOW.to)}`;
  }
}

/**
 * When the daily insight arrives, kept on the backend (it is the backend that sends it). Changes
 * show at once and save in the background; taps made while a save is running collapse into one
 * more save of the latest choice. A failed save puts back what the backend last confirmed.
 */
export class DeliverySettings {
  private state: DeliveryState = { status: 'loading' };
  private readonly listeners = new Set<() => void>();
  private confirmed: Delivery | null = null;
  private queued: Delivery | null = null;
  private saving: Promise<void> | null = null;

  constructor(private readonly timeZone: () => string) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): DeliveryState => this.state;

  load = async (): Promise<void> => {
    if (this.saving) {
      return;
    }
    if (this.state.status !== 'ready') {
      this.set({ status: 'loading' });
    }
    try {
      const delivery = await api.delivery(await accountToken(this.timeZone()));
      this.confirmed = delivery;
      if (!this.saving) {
        this.set({ status: 'ready', delivery, saving: false, failed: false });
      }
    } catch (error) {
      console.warn('Could not load delivery settings', error);
      if (this.state.status !== 'ready') {
        this.set({ status: 'unavailable' });
      }
    }
  };

  choose = (delivery: Delivery): Promise<void> => {
    this.set({ status: 'ready', delivery, saving: true, failed: false });
    this.queued = delivery;
    this.saving ??= this.flush().finally(() => {
      this.saving = null;
    });
    return this.saving;
  };

  private async flush(): Promise<void> {
    while (this.queued) {
      const next = this.queued;
      this.queued = null;
      try {
        this.confirmed = await api.setDelivery(await accountToken(this.timeZone()), next);
      } catch (error) {
        console.warn('Could not save delivery settings', error);
        if (!this.queued) {
          this.set({ status: 'ready', delivery: this.confirmed ?? next, saving: false, failed: true });
          return;
        }
      }
    }
    if (this.confirmed) {
      this.set({ status: 'ready', delivery: this.confirmed, saving: false, failed: false });
    }
  }

  private set(state: DeliveryState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}
