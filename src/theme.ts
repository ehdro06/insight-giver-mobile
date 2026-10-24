import { useColorScheme } from 'react-native';

const light = {
  background: '#F6F3EE',
  text: '#1C1B19',
  muted: '#8A8379',
  border: '#E4DED4',
  entry: '#2F3A4A',
  entryText: '#F6F3EE',
  insight: '#FFF3DC',
  insightText: '#3B2F1B',
  accent: '#B9822B',
};

export type Theme = typeof light;

const dark: Theme = {
  background: '#141312',
  text: '#EDE9E3',
  muted: '#9A938A',
  border: '#2E2B28',
  entry: '#3A4A60',
  entryText: '#F3F1ED',
  insight: '#2D2617',
  insightText: '#F2E6CF',
  accent: '#E0A84B',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

const timestamp = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatTimestamp(iso: string): string {
  return timestamp.format(new Date(iso));
}
