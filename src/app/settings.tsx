import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimePicker } from '@/components/TimePicker';
import { DEFAULT_FIXED_TIME, describe, type DeliveryMode } from '@/lib/delivery';
import { useDelivery } from '@/lib/DiaryProvider';
import { useTheme } from '@/theme';

const OPTIONS: { mode: DeliveryMode; title: string }[] = [
  { mode: 'MORNING', title: 'In the morning' },
  { mode: 'FIXED', title: 'At a time I choose' },
  { mode: 'SURPRISE', title: 'Surprise me' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { state, load, choose } = useDelivery();

  useEffect(() => {
    void load();
  }, [load]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
          <Text style={[styles.done, { color: theme.accent }]}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.section, { color: theme.muted }]}>WHEN YOUR INSIGHT ARRIVES</Text>
        {state.status === 'loading' ? (
          <ActivityIndicator style={styles.loading} color={theme.muted} />
        ) : state.status === 'unavailable' ? (
          <View style={styles.unavailable}>
            <Text style={[styles.message, { color: theme.text }]}>
              Couldn’t reach Insight Giver. Check your connection and try again.
            </Text>
            <Pressable
              onPress={() => void load()}
              style={({ pressed }) => [styles.retry, { borderColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.text }}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { borderColor: theme.border }]}>
            {OPTIONS.map(({ mode, title }, index) => {
              const selected = state.delivery.mode === mode;
              return (
                <Option
                  key={mode}
                  title={title}
                  detail={describe({ mode, time: state.delivery.time })}
                  selected={selected}
                  first={index === 0}
                  onPress={() => {
                    if (!selected) {
                      // The picked time travels along so that switching back to FIXED finds it again.
                      const time = state.delivery.time ?? (mode === 'FIXED' ? DEFAULT_FIXED_TIME : null);
                      void choose({ mode, time });
                    }
                  }}
                >
                  {selected && mode === 'FIXED' ? (
                    <TimePicker
                      value={state.delivery.time ?? DEFAULT_FIXED_TIME}
                      onChange={(time) => void choose({ mode: 'FIXED', time })}
                    />
                  ) : null}
                </Option>
              );
            })}
          </View>
        )}
        {state.status === 'ready' ? (
          <Text style={[styles.message, { color: state.failed ? theme.accent : theme.muted }]}>
            {state.saving
              ? 'Saving…'
              : state.failed
                ? 'Couldn’t save that. Check your connection and try again.'
                : 'One insight a day, at most. It shows up on your home-screen widget.'}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Option({
  title,
  detail,
  selected,
  first,
  onPress,
  children,
}: {
  title: string;
  detail: string;
  selected: boolean;
  first: boolean;
  onPress: () => void;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.option, !first && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.optionRow, { opacity: pressed && !selected ? 0.6 : 1 }]}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
      >
        <View style={[styles.radio, { borderColor: selected ? theme.accent : theme.border }]}>
          {selected ? <View style={[styles.radioDot, { backgroundColor: theme.accent }]} /> : null}
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.optionDetail, { color: theme.muted }]}>{detail}</Text>
        </View>
      </Pressable>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  done: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  section: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  loading: {
    marginVertical: 24,
  },
  unavailable: {
    gap: 12,
    alignItems: 'flex-start',
  },
  retry: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
  },
  optionDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
