import { Link } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Composer } from '@/components/Composer';
import { TimelineRow } from '@/components/TimelineRow';
import { useDiary } from '@/lib/DiaryProvider';
import { useTheme } from '@/theme';

export default function DiaryScreen() {
  const theme = useTheme();
  const { items, write } = useDiary();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Insight Giver</Text>
        <Link href="/settings" asChild>
          <Pressable hitSlop={12} accessibilityRole="button">
            <Text style={[styles.settings, { color: theme.accent }]}>Settings</Text>
          </Pressable>
        </Link>
      </View>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Drop a thought here.</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Nothing to answer, nothing to organize. Once a day, something you wrote will come back to you on your
              home screen.
            </Text>
          </View>
        ) : (
          <FlatList
            inverted
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => <TimelineRow item={item} />}
            contentContainerStyle={styles.list}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}
        <Composer onSubmit={(content) => void write(content)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  settings: {
    fontSize: 15,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 21,
  },
});
