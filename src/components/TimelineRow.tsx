import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimelineItem } from '@/lib/diary';
import { formatTimestamp, useTheme } from '@/theme';

export function TimelineRow({ item }: { item: TimelineItem }) {
  const theme = useTheme();

  if (item.kind === 'entry') {
    const pending = item.entry.syncedAt === null;
    return (
      <View style={[styles.row, styles.entryRow]}>
        <View style={[styles.bubble, { backgroundColor: theme.entry, opacity: pending ? 0.8 : 1 }]}>
          <Text style={[styles.text, { color: theme.entryText }]}>{item.entry.content}</Text>
        </View>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {formatTimestamp(item.entry.writtenAt)}
          {pending ? ' · not synced yet' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.insightRow]}>
      <Link href={{ pathname: '/insight/[id]', params: { id: item.insight.id } }} asChild>
        <Pressable style={[styles.bubble, { backgroundColor: theme.insight, borderColor: theme.accent }, styles.insight]}>
          <Text style={[styles.label, { color: theme.accent }]}>{'✦'} from your diary</Text>
          <Text style={[styles.text, { color: theme.insightText }]}>{item.insight.body}</Text>
        </Pressable>
      </Link>
      <Text style={[styles.meta, { color: theme.muted }]}>{formatTimestamp(item.insight.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: '85%',
    gap: 4,
  },
  entryRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  insightRow: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  insight: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  meta: {
    fontSize: 11,
    marginHorizontal: 6,
  },
});
