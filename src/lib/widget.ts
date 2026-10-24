import InsightNative, { type StoredInsight } from '../../modules/insight-native';

import type { Insight } from './diary';

/**
 * The app is open, so the person has seen today's insight: let the widget show all of it from now
 * on. Returns what the widget holds, which may have arrived by push while the app was closed.
 */
export function revealWidgetInsight(): StoredInsight | null {
  const stored = InsightNative.getInsight();
  if (stored && !stored.revealed) {
    InsightNative.setInsight({ ...stored, revealed: true });
  }
  return stored;
}

/** Catches the widget up with an insight fetched from the backend, e.g. after a push was lost. */
export function showOnWidget(insight: Insight): void {
  const stored = InsightNative.getInsight();
  if (stored && Date.parse(stored.createdAt) >= Date.parse(insight.createdAt)) {
    return;
  }
  InsightNative.setInsight({
    id: insight.id,
    body: insight.body,
    preview: null,
    createdAt: insight.createdAt,
    revealed: true,
  });
}
