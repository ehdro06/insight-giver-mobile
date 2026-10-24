import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

/** Free-form input. Nothing answers back right away; the entry just lands in the diary. */
export function Composer({ onSubmit }: { onSubmit: (content: string) => void }) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const content = draft.trim();

  const submit = () => {
    if (content) {
      onSubmit(content);
      setDraft('');
    }
  };

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="What's on your mind?"
        placeholderTextColor={theme.muted}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        multiline
        maxLength={10_000}
        accessibilityLabel="New diary entry"
      />
      <Pressable
        onPress={submit}
        disabled={!content}
        style={({ pressed }) => [
          styles.send,
          { backgroundColor: theme.entry, opacity: !content ? 0.4 : pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Save entry"
      >
        <Text style={[styles.sendText, { color: theme.entryText }]}>{'↑'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
