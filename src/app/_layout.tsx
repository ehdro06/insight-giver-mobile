import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { DATABASE_NAME, migrate } from '@/lib/diary';
import { DiaryProvider } from '@/lib/DiaryProvider';

// Keeps the diary underneath an insight opened straight from the widget, so "back" has somewhere to go.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <DiaryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="insight/[id]" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </DiaryProvider>
    </SQLiteProvider>
  );
}
