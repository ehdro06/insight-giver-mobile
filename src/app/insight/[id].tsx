import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import InsightNative from '../../../modules/insight-native';

import { useDiary } from '@/lib/DiaryProvider';
import { formatTimestamp, useTheme } from '@/theme';

/**
 * Where a tap on the widget lands (insightgiver://insight/<id>). Opening the app is the point:
 * it is what keeps the OS from throttling the background pushes that feed the widget.
 */
export default function InsightScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, remember } = useDiary();

  const fromTimeline = items.find((item) => item.kind === 'insight' && item.insight.id === id);
  // A tap that cold-starts the app can get here before the timeline has loaded the pushed insight.
  const fromWidget = useMemo(() => {
    const stored = InsightNative.getInsight();
    return stored?.id === id ? stored : null;
  }, [id]);
  const insight = fromTimeline?.kind === 'insight' ? fromTimeline.insight : fromWidget;

  useEffect(() => {
    if (fromWidget) {
      void remember({ id: fromWidget.id, body: fromWidget.body, createdAt: fromWidget.createdAt });
    }
  }, [fromWidget, remember]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.accent }]}>{'✦'} from your diary</Text>
        <Text style={[styles.body, { color: theme.text }]}>{insight?.body ?? 'This insight is still on its way.'}</Text>
        {insight ? (
          <Text style={[styles.date, { color: theme.muted }]}>{formatTimestamp(insight.createdAt)}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={close}
        style={({ pressed }) => [styles.button, { borderColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>Back to writing</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  body: {
    fontSize: 22,
    lineHeight: 31,
  },
  date: {
    fontSize: 13,
  },
  button: {
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});
