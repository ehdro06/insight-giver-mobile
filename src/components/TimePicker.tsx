import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { formatHour, MINUTE_STEP, parseTime, toTime } from '@/lib/delivery';
import { useTheme } from '@/theme';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);
const HOUR_WIDTH = 64;
const GAP = 8;

/** Two taps: an hour from a strip of all 24, then a quarter. */
export function TimePicker({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const theme = useTheme();
  const { hour, minute } = parseTime(value);
  const hours = useRef<ScrollViewInstance>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={hours}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hours}
        onLayout={(event) => {
          // Start with the picked hour in view, a little in from the left edge.
          const x = hour * (HOUR_WIDTH + GAP) - event.nativeEvent.layout.width / 3;
          hours.current?.scrollTo({ x: Math.max(0, x), animated: false });
        }}
      >
        {HOURS.map((h) => (
          <Chip key={h} label={formatHour(h)} selected={h === hour} width={HOUR_WIDTH} onPress={() => onChange(toTime(h, minute))} />
        ))}
      </ScrollView>
      <View style={styles.minutes}>
        {MINUTES.map((m) => (
          <Chip
            key={m}
            label={`:${String(m).padStart(2, '0')}`}
            selected={m === minute}
            onPress={() => onChange(toTime(hour, m))}
          />
        ))}
      </View>
      <Text style={[styles.hint, { color: theme.muted }]}>In this phone’s time zone.</Text>
    </View>
  );
}

function Chip({
  label,
  selected,
  width,
  onPress,
}: {
  label: string;
  selected: boolean;
  width?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        width === undefined ? styles.flexChip : { width },
        selected
          ? { backgroundColor: theme.entry, borderColor: theme.entry }
          : { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.chipText, { color: selected ? theme.entryText : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  hours: {
    gap: GAP,
  },
  minutes: {
    flexDirection: 'row',
    gap: GAP,
  },
  chip: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingVertical: 8,
  },
  flexChip: {
    flex: 1,
  },
  chipText: {
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
  },
});
